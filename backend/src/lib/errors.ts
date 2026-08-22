import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "./logger.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
  }
}

export class UpstreamFetchError extends AppError {
  constructor(message: string, details?: unknown) {
    super(502, "UPSTREAM_FETCH_FAILED", message, details);
  }
}

/**
 * Express error middleware as a class so it reads the same way as the rest of the
 * app's request-handling classes (controllers, services). `handle` is an arrow
 * function class property (not a prototype method) so it can be passed directly to
 * `app.use(ErrorHandler.handle)` without losing its `this` binding — see the
 * "Why arrow-function methods" note in ARCHITECTURE.md.
 */
export class ErrorHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static handle = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const requestId = res.locals.requestId as string | undefined;

    if (err instanceof ZodError) {
      logger.warn({ requestId, issues: err.issues }, "request validation failed");
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request failed validation",
          details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      });
    }

    if (err instanceof AppError) {
      const level = err.statusCode >= 500 ? "error" : "warn";
      logger[level]({ requestId, err, code: err.code }, err.message);
      return res.status(err.statusCode).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    logger.error({ requestId, err }, "unhandled error");
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    });
  };
}
