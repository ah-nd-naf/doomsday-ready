import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { CreateMovieInput, UpdateMovieInput } from "../schemas/movie.schema";
import { wouldCreateCycle } from "../algorithms/wouldCreateCycle";
import { getRewatchOrder } from "../algorithms/getRewatchOrder";

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

export interface RewatchOrderItem {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
}

export interface RewatchOrderResponse {
  target: {
    id: number;
    title: string;
  };
  order: RewatchOrderItem[];
  summary: {
    total: number;
    watched: number;
    unwatched: number;
    remainingRuntimeMinutes: number;
  };
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
   * Helper to load all movies and build a Map<movieId, prerequisiteIds[]>
   */
  private async buildPrereqMap(): Promise<Map<number, number[]>> {
    const allMovies = await prisma.movie.findMany({
      select: {
        id: true,
        prerequisites: {
          select: { id: true },
        },
      },
    });

    const prereqMap = new Map<number, number[]>();
    for (const m of allMovies) {
      prereqMap.set(
        m.id,
        m.prerequisites.map((p) => p.id)
      );
    }
    return prereqMap;
  }

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
   * Replaces prerequisites if prerequisiteIds is provided, verifying cycle safety.
   */
  async update(id: number, input: UpdateMovieInput): Promise<MovieResponse> {
    // 1. Check if the movie exists (404 NOT_FOUND)
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
      // 2. Verify all prerequisiteIds exist in DB (404 NOT_FOUND)
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

      // 3. Cycle check before modifying database
      const prereqMap = await this.buildPrereqMap();
      if (wouldCreateCycle(id, input.prerequisiteIds, prereqMap)) {
        throw AppError.circular(
          "Setting these prerequisites would create a circular dependency"
        );
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

  /**
   * Generates MCU rewatch order and summary for a given target movie.
   */
  async getRewatchOrder(id: number): Promise<RewatchOrderResponse> {
    // 1. Check if target movie exists
    const target = await prisma.movie.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!target) {
      throw AppError.notFound(`Movie with id ${id} not found`);
    }

    // 2. Build prerequisite map and call getRewatchOrder algorithm
    const prereqMap = await this.buildPrereqMap();
    const orderedIds = getRewatchOrder(id, prereqMap);

    // 3. If no prerequisites, return empty list with zeroed summary
    if (orderedIds.length === 0) {
      return {
        target: {
          id: target.id,
          title: target.title,
        },
        order: [],
        summary: {
          total: 0,
          watched: 0,
          unwatched: 0,
          remainingRuntimeMinutes: 0,
        },
      };
    }

    // 4. Fetch movies from DB and preserve the exact order returned by the algorithm
    const movies = await prisma.movie.findMany({
      where: { id: { in: orderedIds } },
      select: {
        id: true,
        title: true,
        releaseYear: true,
        runtime: true,
        watched: true,
      },
    });

    const movieMap = new Map<number, RewatchOrderItem>();
    for (const m of movies) {
      movieMap.set(m.id, m);
    }

    const order: RewatchOrderItem[] = [];
    for (const movieId of orderedIds) {
      const movieItem = movieMap.get(movieId);
      if (movieItem) {
        order.push(movieItem);
      }
    }

    // 5. Calculate summary using a plain loop
    let watchedCount = 0;
    let unwatchedCount = 0;
    let remainingRuntimeMinutes = 0;

    for (const movie of order) {
      if (movie.watched) {
        watchedCount++;
      } else {
        unwatchedCount++;
        remainingRuntimeMinutes += movie.runtime;
      }
    }

    return {
      target: {
        id: target.id,
        title: target.title,
      },
      order,
      summary: {
        total: order.length,
        watched: watchedCount,
        unwatched: unwatchedCount,
        remainingRuntimeMinutes,
      },
    };
  }
}

export const movieService = new MovieService();
