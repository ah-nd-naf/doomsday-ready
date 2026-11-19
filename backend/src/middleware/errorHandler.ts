import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
) => {
  // 1. Handle malformed JSON body from express.json()
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Malformed JSON payload in request body",
      },
    });
  }

  // 2. Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
    });
  }

  // 3. Handle explicit application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  // 4. Handle Prisma database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta?.target as string[]).join(", ")
        : "field";

      return res.status(409).json({
        error: {
          code: "DUPLICATE",
          message: `A record with this ${target} already exists`,
          details: err.meta,
        },
      });
    }

    // Record not found
    if (err.code === "P2025") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Requested database record not found",
        },
      });
    }
  }

  // 5. Fallback for unexpected internal errors
  console.error("Unhandled server error:", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An internal server error occurred",
    },
  });
};
