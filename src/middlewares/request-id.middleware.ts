import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import { requestContext } from "../utils/request-context.util.js";

export function requestIdMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  const id = uuidv4();
  requestContext.run({ requestId: id }, () => {
    next();
  });
}
