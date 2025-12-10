import { TokenPayload } from "@/lib/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}