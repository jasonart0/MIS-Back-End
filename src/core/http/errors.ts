import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({
      error: { code: "invalid_json", message: "Request body must contain valid JSON." },
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    response.status(413).json({
      error: { code: "payload_too_large", message: "Request body exceeds the 1 MB limit." },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      response.status(404).json({
        error: { code: "not_found", message: "The requested record was not found." },
      });
      return;
    }
    if (
      error.code === "P2002" ||
      error.code === "P2003" ||
      error.code === "P2014" ||
      error.code === "P2034"
    ) {
      response.status(409).json({
        error: {
          code: "relationship_conflict",
          message: "The request conflicts with an existing record or relationship.",
        },
      });
      return;
    }
    if (error.code === "P2004") {
      response.status(400).json({
        error: {
          code: "constraint_violation",
          message: "The request violates a database constraint.",
        },
      });
      return;
    }
  }

  console.error("Unhandled request error", error);
  response.status(500).json({
    error: { code: "internal_error", message: "An unexpected server error occurred." },
  });
};
