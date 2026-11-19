export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE"
  | "CIRCULAR_DEPENDENCY"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(400, "VALIDATION_ERROR", message, details);
  }

  static notFound(message: string, details?: unknown): AppError {
    return new AppError(404, "NOT_FOUND", message, details);
  }

  static duplicate(message: string, details?: unknown): AppError {
    return new AppError(409, "DUPLICATE", message, details);
  }

  static circular(message: string, details?: unknown): AppError {
    return new AppError(409, "CIRCULAR_DEPENDENCY", message, details);
  }

  static internal(message = "An unexpected error occurred"): AppError {
    return new AppError(500, "INTERNAL_SERVER_ERROR", message);
  }
}
