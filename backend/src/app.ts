import express, { Request, Response, NextFunction } from "express";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { AppError } from "./errors/AppError";

const app = express();

app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Main API routes
app.use("/api", apiRouter);

// Unknown routes 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound("Route not found"));
});

// Central error handler
app.use(errorHandler);

export default app;
