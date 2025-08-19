import ErrorCode from "./error-codes.error";

class CustomError extends Error {
  override name = "CustomError";
  override message: string;
  statusCode: number;
  code: ErrorCode;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode = ErrorCode.Unknown,
  ) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default CustomError;
