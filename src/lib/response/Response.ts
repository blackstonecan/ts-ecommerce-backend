import CustomError from "@/lib/error/CustomError";

class Response<T = unknown> {
  success: boolean;
  data: T | null;
  error: CustomError | null;

  private constructor(success: boolean, data: T | null, error: CustomError | null) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static getSuccess<T>(data: T): Response<T> {
    return new Response<T>(true, data, null);
  }

  static getError(err: Error, status?: number): Response<any> {
    return new Response<any>(false, null, new CustomError(err, status));
  }

  static getCustomError(err: CustomError): Response<any> {
    return new Response<any>(false, null, err);
  }

  static getMessageError(message: string, status?: number): Response<any> {
    return new Response<any>(false, null, CustomError.getWithMessage(message, status));
  }
}

export default Response;
