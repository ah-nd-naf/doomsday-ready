import { z } from "zod";

export const createMovieSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title must not be empty"),
    releaseYear: z
      .number()
      .int("releaseYear must be an integer")
      .min(1900, "releaseYear must be between 1900 and 2100")
      .max(2100, "releaseYear must be between 1900 and 2100"),
    runtime: z
      .number()
      .int("runtime must be an integer")
      .min(1, "runtime must be between 1 and 300 minutes")
      .max(300, "runtime must be between 1 and 300 minutes"),
    watched: z.boolean().optional(),
    prerequisiteIds: z
      .array(
        z
          .number()
          .int("Prerequisite IDs must be integers")
          .positive("Prerequisite IDs must be positive integers")
      )
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "prerequisiteIds must not contain duplicate IDs",
      })
      .optional(),
  })
  .strict();

export const createMoviesInputSchema = z.union([
  createMovieSchema,
  z.array(createMovieSchema).min(1, "Array must contain at least one movie"),
]);

export const updateMovieSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title must not be empty")
      .optional(),
    releaseYear: z
      .number()
      .int("releaseYear must be an integer")
      .min(1900, "releaseYear must be between 1900 and 2100")
      .max(2100, "releaseYear must be between 1900 and 2100")
      .optional(),
    runtime: z
      .number()
      .int("runtime must be an integer")
      .min(1, "runtime must be between 1 and 300 minutes")
      .max(300, "runtime must be between 1 and 300 minutes")
      .optional(),
    watched: z.boolean().optional(),
    prerequisiteIds: z
      .array(
        z
          .number()
          .int("Prerequisite IDs must be integers")
          .positive("Prerequisite IDs must be positive integers")
      )
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "prerequisiteIds must not contain duplicate IDs",
      })
      .optional(),
  })
  .strict();

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
