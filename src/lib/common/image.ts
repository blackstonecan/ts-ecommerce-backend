import sharp from "sharp";
import Response from "../response/Response";
import { errorHandler } from "../error/errorHandler";

export type EncodeResult = {
  buffer: Buffer;
  encoder: "webp" | "original";
  mime: "image/webp" | "image/jpeg" | "image/png" | string;
  ext: string;
  bytesIn: number;
  bytesOut: number;
  achievedRatio: number;
  quality?: number;
};

type CompressOpts = {
  /** Max output width (no upscaling) */
  maxWidth?: number;               // default 800
  /** WebP effort 0..6 (4 is a good balance) */
  effort?: number;                 // default 4
  /** Quality candidates to try in order */
  qualities?: number[];            // default [75, 68, 60]
  /** Stop when bytesOut <= bytesIn * (1 - TARGET_REDUCTION) */
  targetReduction?: number;        // default 0.35 (35%)
  /** Optional absolute budget in bytes (stop when under this) */
  targetBytes?: number;            // default undefined
  /** Timeout seconds for sharp pipeline */
  timeoutSeconds?: number;         // default 10
};

/**
 * Resize to 800px wide and encode WebP with sane quality.
 * Tries a few qualities and picks the first that meets targets.
 */
export async function compressToWebp800(
  input: Buffer,
  opts: CompressOpts = {}
): Promise<Response<EncodeResult>> {
  try {
    const MAX_WIDTH = opts.maxWidth ?? 800;
    const EFFORT = opts.effort ?? 4;                 // quality/speed balance
    const QUALS = opts.qualities ?? [75, 68, 60];    // tweak if needed
    const TARGET_REDUCTION = opts.targetReduction ?? 0.35; // 35% smaller than input
    const TARGET_BYTES = opts.targetBytes;           // optional hard cap
    const TIMEOUT = opts.timeoutSeconds ?? 10;

    // Build a base pipeline only for reading/metadata
    const base = sharp(input, {
      failOnError: false,
      animated: false,              // uploads usually single-frame
      limitInputPixels: 268402689
    })
      .rotate()
      .toColourspace("srgb")
      .timeout({ seconds: TIMEOUT });

    const meta = await base.metadata();
    const hasAlpha = !!meta.hasAlpha;

    // Prepare a resized version first (no upscaling)
    const resized = sharp(input)
      .rotate()
      .toColourspace("srgb")
      .resize({
        width: meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : undefined,
        withoutEnlargement: true
      })
      .timeout({ seconds: TIMEOUT });

    // Try qualities in order; stop when good enough
    const attempts: Array<{ q: number; buf: Buffer }> = [];
    for (const q of QUALS) {
      const buf = await resized
        .clone()
        .webp({
          quality: clamp(q, 40, 95),               // guard rails
          alphaQuality: hasAlpha ? clamp(q, 40, 95) : undefined,
          effort: clamp(EFFORT, 0, 6),
          smartSubsample: true,                    // better chroma
          preset: "photo",                         // better for photos
          lossless: false,
          nearLossless: false
        })
        .toBuffer();

      attempts.push({ q, buf });

      const smallerByRatio = buf.length <= input.length * (1 - TARGET_REDUCTION);
      const underBudget = typeof TARGET_BYTES === "number" ? buf.length <= TARGET_BYTES : false;

      if (smallerByRatio || underBudget) {
        return successFrom(input, buf, q);
      }
    }

    // If none met the target, pick the smallest of the attempts
    const best = attempts.reduce((min, cur) => (cur.buf.length < min.buf.length ? cur : min), attempts[0]);

    // Return WebP if smaller than original, else original
    if (best && best.buf.length < input.length) {
      return successFrom(input, best.buf, best.q);
    } else {
      return originalFrom(input, meta);
    }
  } catch (error) {
    return errorHandler(error);
  }
}

// ---- helpers ----

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function successFrom(input: Buffer, out: Buffer, q: number): Response<EncodeResult> {
  return Response.getSuccess({
    buffer: out,
    encoder: "webp",
    mime: "image/webp",
    ext: "webp",
    bytesIn: input.length,
    bytesOut: out.length,
    achievedRatio: out.length / input.length,
    quality: q
  });
}

function originalFrom(input: Buffer, meta: sharp.Metadata): Response<EncodeResult> {
  const originalMime =
    meta.format === "webp" ? "image/webp" :
    meta.format === "jpeg" ? "image/jpeg" :
    meta.format === "png"  ? "image/png"  :
    "image/jpeg";

  return Response.getSuccess({
    buffer: input,
    encoder: "original",
    mime: originalMime,
    ext: meta.format || "jpg",
    bytesIn: input.length,
    bytesOut: input.length,
    achievedRatio: 1
  });
}