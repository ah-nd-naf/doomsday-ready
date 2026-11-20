import { z } from "zod";

export const createCinemaSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "name must not be empty"),
    bundleSizes: z
      .array(
        z
          .number()
          .int("bundleSizes must contain integers")
          .min(1, "bundle size must be between 1 and 500")
          .max(500, "bundle size must be between 1 and 500")
      )
      .min(1, "bundleSizes must contain at least 1 size")
      .max(10, "bundleSizes must contain at most 10 sizes")
      .refine((sizes) => new Set(sizes).size === sizes.length, {
        message: "bundleSizes must contain distinct integers (duplicates rejected)",
      }),
  })
  .strict();

export const createCinemasInputSchema = z.union([
  createCinemaSchema,
  z.array(createCinemaSchema).min(1, "Array must contain at least one cinema"),
]);

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
