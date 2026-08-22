import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

/** Stamps every request with a short id, used to correlate log lines for one request. */
export class RequestContextMiddleware {
  static attach = (req: Request, res: Response, next: NextFunction) => {
    res.locals.requestId = nanoid(10);
    res.setHeader("X-Request-Id", res.locals.requestId as string);
    next();
  };
}
