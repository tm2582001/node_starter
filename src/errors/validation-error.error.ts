import CustomError from "./custom-error.error";
import ErrorCode from "./error-codes.error";

class ValidationError extends CustomError {
  override code = ErrorCode.InvalidInput;

  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode, ErrorCode.InvalidInput);
  }
}

export default ValidationError;
