/**
 * Seed script for Doomsday Ready database.
 *
 * NOTE: The movies and cinemas below are sample data for the challenge;
 * runtimes and release years are approximate for testing purposes.
 */

import { prisma } from "../src/lib/prisma";

interface MovieSeedData {
  title: string;
  releaseYear: number;
  runtime: number;
  prerequisites: string[];
}

interface CinemaSeedData {
  name: string;
  bundleSizes: number[];
}

const movies: MovieSeedData[] = [
  {
    title: "Iron Man",
    releaseYear: 2008,
    runtime: 126,
    prerequisites: [],
  },
  {
    title: "Captain America: The First Avenger",
    releaseYear: 2011,
    runtime: 124,
    prerequisites: [],
  },
  {
    title: "The Avengers",
    releaseYear: 2012,
    runtime: 143,
    prerequisites: ["Iron Man", "Captain America: The First Avenger"],
  },
  {
    title: "Captain America: Civil War",
    releaseYear: 2016,
    runtime: 147,
    prerequisites: ["The Avengers"],
  },
  {
    title: "Thor: Ragnarok",
    releaseYear: 2017,
    runtime: 130,
    prerequisites: [],
  },
  {
    title: "Avengers: Infinity War",
    releaseYear: 2018,
    runtime: 149,
    prerequisites: ["Captain America: Civil War", "Thor: Ragnarok"],
  },
  {
    title: "Avengers: Endgame",
    releaseYear: 2019,
    runtime: 181,
    prerequisites: ["Avengers: Infinity War"],
  },
  {
    title: "Avengers: Doomsday",
    releaseYear: 2026,
    runtime: 150,
    prerequisites: ["Avengers: Endgame"],
  },
];

const cinemas: CinemaSeedData[] = [
  {
    name: "Test Cinema A",
    bundleSizes: [1, 3, 4],
  },
  {
    name: "Test Cinema B",
    bundleSizes: [2, 5],
  },
  {
    name: "Test Cinema C",
    bundleSizes: [6, 9, 20],
  },
  {
    name: "Test Cinema D",
    bundleSizes: [4, 6],
  },
];

async function main() {
  console.log("Seeding cinemas...");
  for (const cinema of cinemas) {
    await prisma.cinema.upsert({
      where: { name: cinema.name },
      update: { bundleSizes: cinema.bundleSizes },
      create: {
        name: cinema.name,
        bundleSizes: cinema.bundleSizes,
      },
    });
  }

  console.log("Seeding movies in dependency order...");
  for (const movie of movies) {
    const prereqConnect = movie.prerequisites.map((title) => ({ title }));

    await prisma.movie.upsert({
      where: { title: movie.title },
      update: {
        releaseYear: movie.releaseYear,
        runtime: movie.runtime,
        prerequisites: {
          set: prereqConnect,
        },
      },
      create: {
        title: movie.title,
        releaseYear: movie.releaseYear,
        runtime: movie.runtime,
        prerequisites: {
          connect: prereqConnect,
        },
      },
    });
  }

  const movieCount = await prisma.movie.count();
  const cinemaCount = await prisma.cinema.count();

  console.log(
    `Seed completed successfully: ${movieCount} movies, ${cinemaCount} cinemas in database.`
  );
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
