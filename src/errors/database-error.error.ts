import CustomError from "./custom-error.error";
import ErrorCode from "./error-codes.error";

class DatabaseError extends CustomError {
  override code = ErrorCode.Database;

  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, ErrorCode.Database);
  }
}

export default DatabaseError;
