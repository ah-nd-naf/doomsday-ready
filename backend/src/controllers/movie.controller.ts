import { Request, Response, NextFunction } from "express";
import { movieService } from "../services/movie.service";
import {
  createMoviesInputSchema,
  updateMovieSchema,
} from "../schemas/movie.schema";
import { AppError } from "../errors/AppError";

export class MovieController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const movies = await movieService.getAll();
      res.json(movies);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createMoviesInputSchema.parse(req.body);
      const created = await movieService.create(validated);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw AppError.validation("Invalid movie id: must be a positive integer");
      }

      const validated = updateMovieSchema.parse(req.body);
      const updated = await movieService.update(id, validated);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async getRewatchOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw AppError.validation("Invalid movie id: must be a positive integer");
      }

      const rewatchOrder = await movieService.getRewatchOrder(id);
      res.json(rewatchOrder);
    } catch (err) {
      next(err);
    }
  }
}

export const movieController = new MovieController();
