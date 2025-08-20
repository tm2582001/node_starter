import { DrizzleQueryError } from "drizzle-orm/errors";
import type { Request, Response } from "express";
import z from "zod";

import { alumniRecord } from "@/db/schemas/alumni-record.schema";
import DatabaseError from "@/errors/database-error.error";
import ValidationError from "@/errors/validation-error.error";
import logger from "@/logger";
import getErrorTrace from "@/utils/errors/get-error-traces.util";

const aluminiDataSchema = z.object({
  name: z.string(),
  studentCode: z.string(),
  enrollmentId: z.coerce.number().positive().nullish(),
  fatherName: z.string().nullish(),
  motherName: z.string().nullish(),
  address: z.string(),
  contactNumber: z.string(),
  emailId: z.email(),
  userName: z.string().nullish(),
  password: z.string().nullish(),
  programId: z.coerce.number().positive(),
  passOutYearId: z.coerce.number().positive(),
  passOutRank: z.string().nullish(),
  sortOrder: z.coerce.number().optional(),
  photoFile: z.string().nullish(),
  remarks: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  pincode: z.string(),
  country: z.string(),
  tempProgram: z.string().optional(),
  tempDepartment: z.string().optional(),
  tempPD: z.string().optional(),
});

const saveAlumni = async (req: Request, res: Response) => {
  logger.info("save allumini data requested");
  const { body, db } = req;

  if (!body) {
    logger.error("no body recieved");
    const error = new ValidationError("No body found in request");
    getErrorTrace(error);
    throw error;
  }

  logger.debug("requested data: ", {
    logMetadata: JSON.stringify(body),
  });

  const validatedData = aluminiDataSchema.safeParse(body);

  if (!validatedData.success) {
    const errorMessage = validatedData.error.issues
      .map((err) => `${err.path.join(".")}:${err.message}`)
      .join("\n  ");

    const error = new ValidationError(
      `Configuration validation failed:\n ${errorMessage}`,
    );
    getErrorTrace(error);
    throw error;
  }

  logger.info(
    `user requested for alumni with emailId: ${validatedData.data.emailId}`,
  );

  try {
    const user = await db.insert(alumniRecord).values(validatedData.data);
    logger.info(
      `saved data successfully for emailId: ${validatedData.data.emailId}`,
    );

    logger.debug(
      `registration response for emailId: ${validatedData.data.emailId} `,
      {
        logMetadata: JSON.stringify(user),
      },
    );

    return res.status(200).json({
      success: true,
      message: "Alumni record saved successfully",
      data: {
        id: user[0].insertId,
        emailId: validatedData.data.emailId,
      },
    });
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

export default saveAlumni;
