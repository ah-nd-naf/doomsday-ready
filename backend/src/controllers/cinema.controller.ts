import { Request, Response, NextFunction } from "express";
import { cinemaService } from "../services/cinema.service";
import { createCinemasInputSchema } from "../schemas/cinema.schema";
import { AppError } from "../errors/AppError";

export class CinemaController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cinemas = await cinemaService.getAll();
      res.json(cinemas);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createCinemasInputSchema.parse(req.body);
      const created = await cinemaService.create(validated);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async getBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw AppError.validation("Invalid cinema id: must be a positive integer");
      }

      const rawGroupSize = req.query.groupSize;
      if (rawGroupSize === undefined || rawGroupSize === "") {
        throw AppError.validation("groupSize query parameter is required");
      }

      const groupSize = Number(rawGroupSize);
      if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 10000) {
        throw AppError.validation(
          "groupSize must be an integer between 1 and 10000"
        );
      }

      const booking = await cinemaService.getBooking(id, groupSize);
      res.json(booking);
    } catch (err) {
      next(err);
    }
  }
}

export const cinemaController = new CinemaController();
