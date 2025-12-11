import { randomUUID } from "crypto";
import path from "path";
import { copyS3Object, headS3Object, putObject } from "@/config/s3";
import Response from "../response/Response";
import { errorHandler } from "../error/errorHandler";
import { compressToWebp800, EncodeResult } from "./image";

type UploadIn = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

export type UploadOut = {
  key: string;
  mime: string;
  size: number;
  ext: string;
  compressionRatio?: number;
  quality?: number;
};

type DuplicateIn = {
  sourceKey: string;
};

export type DuplicateOut = {
  key: string;
  mime: string;
  size: number;
  ext: string;
};

const dot = (ext: string) => (ext ? `.${ext}` : "");

function extFromMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case "image/webp": return "webp";
    case "image/avif": return "avif";
    case "image/jpeg":
    case "image/jpg": return "jpg";
    case "image/png": return "png";
    case "image/gif": return "gif";
    case "image/bmp": return "bmp";
    default: return "";
  }
}

// extensions we consider images we can process
const PROCESSABLE_RE = /^image\/(png|jpe?g|webp|avif|gif|bmp|heic|heif)$/i;

const uploadImage = async (data: UploadIn): Promise<Response<UploadOut>> => {
  try {
    let uploadBuffer = data.buffer;
    let uploadMime = data.mimetype;
    let uploadSize = data.size;
    let uploadExt =
      (data.originalname.split(".").pop() || "").toLowerCase() ||
      extFromMime(uploadMime) ||
      "bin";
    let compressionRatio: number | undefined;
    let quality: number | undefined;

    // Always try to convert processable images to 800px WebP.
    if (PROCESSABLE_RE.test(data.mimetype)) {
      const compResponse = await compressToWebp800(data.buffer, {
        maxWidth: 800,
        // Good defaults; tweak if needed
        qualities: [75, 68, 60],
        effort: 4,
        targetReduction: 0.35,  // 35% smaller than input counts as "good"
        timeoutSeconds: 10
      });

      if (!compResponse.success) throw compResponse.error;
      const comp = compResponse.data as EncodeResult;

      // If our converter produced a smaller output (expected), use it.
      if (comp.encoder === "webp" && comp.bytesOut < data.size) {
        uploadBuffer = comp.buffer;
        uploadMime   = comp.mime;       // "image/webp"
        uploadSize   = comp.bytesOut;
        uploadExt    = comp.ext;        // "webp"
        compressionRatio = comp.achievedRatio;
        quality          = comp.quality;
      } else {
        // Fallback to original when conversion isn't smaller.
        uploadExt = extFromMime(uploadMime) || uploadExt || "bin";
      }
    } else {
      // Non-image or unprocessable mimetype → keep original
      uploadExt = extFromMime(uploadMime) ||
        (path.extname(data.originalname).replace(".", "") || "bin");
    }

    // Build S3 key
    const date = new Date().toISOString().split("T")[0];
    const key = `uploads/${date}/${randomUUID()}${dot(uploadExt)}`;

    await putObject({
      Key: key,
      Body: uploadBuffer,
      ContentType: uploadMime, // matches actual buffer type
      // Optional but recommended for immutable uploads:
      // CacheControl: "public, max-age=31536000, immutable"
    });

    return Response.getSuccess({
      key,
      mime: uploadMime,
      size: uploadSize,
      ext: uploadExt,
      ...(compressionRatio !== undefined && { compressionRatio }),
      ...(quality !== undefined && { quality })
    });
  } catch (error) {
    return errorHandler(error);
  }
};

export const duplicateImageOnS3 = async (
  data: DuplicateIn
): Promise<Response<DuplicateOut>> => {
  try {
    const head = await headS3Object(data.sourceKey);
    if (!head.success) throw head.error;

    const mime = head.data?.contentType || "application/octet-stream";
    const size = head.data?.contentLength ?? 0;

    const extFromHeader = extFromMime(mime);
    const extFromKey = path.extname(data.sourceKey).replace(".", "");
    const ext = extFromHeader || extFromKey || "bin";

    const date = new Date().toISOString().split("T")[0];
    const newKey = `uploads/${date}/${randomUUID()}${dot(ext)}`;

    const copyRes = await copyS3Object({
      sourceKey: data.sourceKey,
      destinationKey: newKey,
      contentType: mime
    });
    if (!copyRes.success) throw copyRes.error;

    return Response.getSuccess({
      key: newKey,
      mime,
      size,
      ext
    });
  } catch (error) {
    return errorHandler(error);
  }
};

export { uploadImage };