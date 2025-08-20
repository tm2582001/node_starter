import { eq, DrizzleQueryError } from "drizzle-orm";
import { Request, Response } from "express";

import { passoutYearMaster } from "@/db/schemas/passout-year-master.schema";
import DatabaseError from "@/errors/database-error.error";
import logger from "@/logger";
import getErrorTrace from "@/utils/errors/get-error-traces.util";

const getPassoutYears = async (req: Request, res: Response) => {
  logger.info("user requested to get passout years");
  const { db } = req;

  try {
    const response = await db
      .select()
      .from(passoutYearMaster)
      .where(eq(passoutYearMaster.enableStatus, 1));

    logger.info(`send data successfully with length ${response.length}`);

    logger.debug("send years response to user with response: ", {
      logMetadata: JSON.stringify(response),
    });

    res.json(response);
  } catch (error: unknown) {
    if (error instanceof DrizzleQueryError) {
      logger.error(
        `error while saving user in db - ${error.cause?.name} ${JSON.stringify(error.cause)}`,
      );
      const dbError = new DatabaseError(error.cause?.message || error.message);
      getErrorTrace(dbError);
      throw dbError;
    }

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      "code" in error
    ) {
      logger.error(
        `error while saving user in db - ${error.code} ${error.message}`,
      );

      const dbError = new DatabaseError(error.message as string);
      getErrorTrace(dbError);
      throw dbError;
    }

    if (error instanceof Error) {
      logger.error(`error while saving user in db - ${error.message}`);
      const dbError = new DatabaseError(error.message as string);
      getErrorTrace(dbError);
      throw dbError;
    }

    throw error;
  }
};

export default getPassoutYears;
