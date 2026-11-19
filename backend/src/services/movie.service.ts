import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { CreateMovieInput, UpdateMovieInput } from "../schemas/movie.schema";

export interface MovieResponse {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisites: {
    id: number;
    title: string;
  }[];
}

const movieSelect = {
  id: true,
  title: true,
  releaseYear: true,
  runtime: true,
  watched: true,
  prerequisites: {
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      id: "asc" as const,
    },
  },
};

export class MovieService {
  /**
   * Retrieves all movies ordered by id, including their direct prerequisites.
   */
  async getAll(): Promise<MovieResponse[]> {
    return prisma.movie.findMany({
      orderBy: { id: "asc" },
      select: movieSelect,
    });
  }

  /**
   * Creates one or multiple movies.
   * If an array is provided, it is processed in order within a single transaction.
   * If any movie fails (e.g., missing prerequisite or duplicate title), all operations roll back.
   */
  async create(
    input: CreateMovieInput | CreateMovieInput[]
  ): Promise<MovieResponse | MovieResponse[]> {
    const isArray = Array.isArray(input);
    const items = isArray ? input : [input];

    const createdMovies = await prisma.$transaction(async (tx) => {
      const results: MovieResponse[] = [];

      for (const item of items) {
        // Validate that all prerequisiteIds refer to existing movies
        if (item.prerequisiteIds && item.prerequisiteIds.length > 0) {
          const existingPrereqs = await tx.movie.findMany({
            where: { id: { in: item.prerequisiteIds } },
            select: { id: true },
          });

          const foundIds = new Set(existingPrereqs.map((p) => p.id));
          const missingIds = item.prerequisiteIds.filter((id) => !foundIds.has(id));

          if (missingIds.length > 0) {
            throw AppError.notFound(
              `Prerequisite movie(s) not found: ${missingIds.join(", ")}`,
              { missingIds }
            );
          }
        }

        const movie = await tx.movie.create({
          data: {
            title: item.title,
            releaseYear: item.releaseYear,
            runtime: item.runtime,
            watched: item.watched ?? false,
            prerequisites:
              item.prerequisiteIds && item.prerequisiteIds.length > 0
                ? {
                    connect: item.prerequisiteIds.map((id) => ({ id })),
                  }
                : undefined,
          },
          select: movieSelect,
        });

        results.push(movie);
      }

      return results;
    });

    return isArray ? createdMovies : createdMovies[0];
  }

  /**
   * Updates an existing movie by ID.
   * Replaces prerequisites if prerequisiteIds is provided.
   */
  async update(id: number, input: UpdateMovieInput): Promise<MovieResponse> {
    // Check if the movie exists
    const existing = await prisma.movie.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw AppError.notFound(`Movie with id ${id} not found`);
    }

    const data: Prisma.MovieUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }
    if (input.releaseYear !== undefined) {
      data.releaseYear = input.releaseYear;
    }
    if (input.runtime !== undefined) {
      data.runtime = input.runtime;
    }
    if (input.watched !== undefined) {
      data.watched = input.watched;
    }

    if (input.prerequisiteIds !== undefined) {
      // TODO(author): cycle check goes here

      // Verify all prerequisiteIds exist
      if (input.prerequisiteIds.length > 0) {
        const existingPrereqs = await prisma.movie.findMany({
          where: { id: { in: input.prerequisiteIds } },
          select: { id: true },
        });

        const foundIds = new Set(existingPrereqs.map((p) => p.id));
        const missingIds = input.prerequisiteIds.filter((pid) => !foundIds.has(pid));

        if (missingIds.length > 0) {
          throw AppError.notFound(
            `Prerequisite movie(s) not found: ${missingIds.join(", ")}`,
            { missingIds }
          );
        }
      }

      // Replaces the full set of prerequisites
      data.prerequisites = {
        set: input.prerequisiteIds.map((pid) => ({ id: pid })),
      };
    }

    return prisma.movie.update({
      where: { id },
      data,
      select: movieSelect,
    });
  }
}

export const movieService = new MovieService();
