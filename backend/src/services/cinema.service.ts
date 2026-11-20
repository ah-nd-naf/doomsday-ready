import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";
import { CreateCinemaInput } from "../schemas/cinema.schema";
import { findMinBundles, BundleCount } from "../algorithms/findMinBundles";

export interface CinemaResponse {
  id: number;
  name: string;
  bundleSizes: number[];
}

export interface BookingSuccessResponse {
  cinema: {
    id: number;
    name: string;
  };
  groupSize: number;
  possible: true;
  totalBundles: number;
  bundles: BundleCount[];
}

export interface BookingFailureResponse {
  cinema: {
    id: number;
    name: string;
  };
  groupSize: number;
  possible: false;
  message: string;
}

export type BookingResponse = BookingSuccessResponse | BookingFailureResponse;

export class CinemaService {
  /**
   * Retrieves all cinemas ordered by id ascending.
   */
  async getAll(): Promise<CinemaResponse[]> {
    return prisma.cinema.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        bundleSizes: true,
      },
    });
  }

  /**
   * Creates one cinema or an array of cinemas.
   * If an array is provided, it is processed in order within a single transaction.
   * If any item fails, all operations roll back.
   */
  async create(
    input: CreateCinemaInput | CreateCinemaInput[]
  ): Promise<CinemaResponse | CinemaResponse[]> {
    const isArray = Array.isArray(input);
    const items = isArray ? input : [input];

    const createdCinemas = await prisma.$transaction(async (tx) => {
      const results: CinemaResponse[] = [];

      for (const item of items) {
        const cinema = await tx.cinema.create({
          data: {
            name: item.name,
            bundleSizes: item.bundleSizes,
          },
          select: {
            id: true,
            name: true,
            bundleSizes: true,
          },
        });
        results.push(cinema);
      }

      return results;
    });

    return isArray ? createdCinemas : createdCinemas[0];
  }

  /**
   * Computes the minimum ticket bundles for a booking at the given cinema.
   */
  async getBooking(id: number, groupSize: number): Promise<BookingResponse> {
    const cinema = await prisma.cinema.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bundleSizes: true,
      },
    });

    if (!cinema) {
      throw AppError.notFound(`Cinema with id ${id} not found`);
    }

    const bundles = findMinBundles(cinema.bundleSizes, groupSize);

    if (bundles === null) {
      return {
        cinema: {
          id: cinema.id,
          name: cinema.name,
        },
        groupSize,
        possible: false,
        message: `No exact combination of bundles adds up to ${groupSize} seats`,
      };
    }

    let totalBundles = 0;
    for (const b of bundles) {
      totalBundles += b.count;
    }

    return {
      cinema: {
        id: cinema.id,
        name: cinema.name,
      },
      groupSize,
      possible: true,
      totalBundles,
      bundles,
    };
  }
}

export const cinemaService = new CinemaService();
