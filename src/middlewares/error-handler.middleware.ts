import { Request, Response, NextFunction } from "express";

import CustomError from "@/errors/custom-error.error";
import DatabaseError from "@/errors/database-error.error";
import ErrorCode from "@/errors/error-codes.error";
import ValidationError from "@/errors/validation-error.error";
import logger from "@/logger";
import getErrorMessage from "@/utils/errors/get-error-message.util";

const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error && typeof error === "object" && "stack" in error) {
    logger.error(error.stack);
  }

  if (error instanceof DatabaseError) {
    logger.info(
      `send database error with statusCode ${error.statusCode} and code: ${error.code}`,
    );

    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });

    return;
  }

  if (error instanceof ValidationError) {
    logger.info(
      `send validation error with statusCode ${error.statusCode} and code: ${error.code}`,
    );
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  if (error instanceof CustomError) {
    logger.info(
      `send custom error with statusCode ${error.statusCode} and code: ${error.code}`,
    );

    if (error.code === ErrorCode.Unknown) {
      logger.warn(
        `please try not to send unknown error for message: ${error.message}`,
      );
    }

    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  const message =
    getErrorMessage(error) ||
    "An error occurred. Please view logs for more details";

  logger.warn(`found unidentified error with message: ${message}`);

  res.status(500).json({
    error: {
      message,
      code: ErrorCode.Unknown,
    },
  });
};

export default errorHandler;
