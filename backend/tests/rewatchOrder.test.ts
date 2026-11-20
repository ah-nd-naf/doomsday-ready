import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("Rewatch Order API & Cycle Prevention", () => {
  const testRunId = Date.now();
  const testPrefix = `RewatchTest_${testRunId}`;
  const createdMovieIds: number[] = [];

  const registerMovie = (id: number) => {
    createdMovieIds.push(id);
    return id;
  };

  afterAll(async () => {
    if (createdMovieIds.length > 0) {
      await prisma.movie.deleteMany({
        where: { id: { in: createdMovieIds } },
      });
    }
    await prisma.movie.deleteMany({
      where: { title: { startsWith: testPrefix } },
    });
    await prisma.$disconnect();
  });

  describe("Cycle prevention on PATCH /api/movies/:id", () => {
    it("returns 409 CIRCULAR_DEPENDENCY when making Avengers: Endgame a prerequisite of Iron Man, and preserves Iron Man prerequisites", async () => {
      // Fetch Iron Man and Avengers: Endgame from seeded data
      const ironMan = await prisma.movie.findUniqueOrThrow({
        where: { title: "Iron Man" },
        include: { prerequisites: true },
      });
      const endgame = await prisma.movie.findUniqueOrThrow({
        where: { title: "Avengers: Endgame" },
      });

      expect(ironMan.prerequisites).toEqual([]);

      // Attempt to make Endgame a prerequisite of Iron Man (creates cycle: Iron Man -> Endgame -> ... -> Iron Man)
      const res = await request(app)
        .patch(`/api/movies/${ironMan.id}`)
        .send({ prerequisiteIds: [endgame.id] });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("CIRCULAR_DEPENDENCY");

      // Verify that GET /api/movies shows Iron Man still has no prerequisites
      const getRes = await request(app).get("/api/movies");
      expect(getRes.status).toBe(200);

      const ironManAfter = getRes.body.find(
        (m: { id: number }) => m.id === ironMan.id
      );
      expect(ironManAfter).toBeDefined();
      expect(ironManAfter.prerequisites).toEqual([]);
    });

    it("returns 409 CIRCULAR_DEPENDENCY when patching a movie to depend on itself", async () => {
      const ironMan = await prisma.movie.findUniqueOrThrow({
        where: { title: "Iron Man" },
      });

      const res = await request(app)
        .patch(`/api/movies/${ironMan.id}`)
        .send({ prerequisiteIds: [ironMan.id] });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("CIRCULAR_DEPENDENCY");
    });
  });

  describe("GET /api/movies/:id/rewatch-order on seeded data", () => {
    it("returns 7 movies in topological order for Avengers: Doomsday", async () => {
      const doomsday = await prisma.movie.findUniqueOrThrow({
        where: { title: "Avengers: Doomsday" },
      });

      const res = await request(app).get(
        `/api/movies/${doomsday.id}/rewatch-order`
      );

      expect(res.status).toBe(200);
      expect(res.body.target).toEqual({
        id: doomsday.id,
        title: "Avengers: Doomsday",
      });

      const { order, summary } = res.body;
      expect(order).toHaveLength(7);
      expect(summary.total).toBe(7);

      // Verify Doomsday itself is not in the order
      const orderIds = order.map((m: { id: number }) => m.id);
      expect(orderIds).not.toContain(doomsday.id);

      // Verify topological validity: for every movie in the returned order,
      // all of its prerequisites appear strictly earlier in the order
      const allMoviesWithPrereqs = await prisma.movie.findMany({
        where: { id: { in: orderIds } },
        include: { prerequisites: { select: { id: true } } },
      });
      const prereqMap = new Map<number, number[]>(
        allMoviesWithPrereqs.map((m) => [m.id, m.prerequisites.map((p) => p.id)])
      );

      const seen = new Set<number>();
      for (const id of orderIds) {
        const prereqs = prereqMap.get(id) ?? [];
        for (const prereqId of prereqs) {
          expect(seen.has(prereqId)).toBe(true);
        }
        seen.add(id);
      }
    });

    it("returns Iron Man and First Avenger (either order) then The Avengers for Civil War", async () => {
      const civilWar = await prisma.movie.findUniqueOrThrow({
        where: { title: "Captain America: Civil War" },
      });

      const res = await request(app).get(
        `/api/movies/${civilWar.id}/rewatch-order`
      );

      expect(res.status).toBe(200);
      expect(res.body.target).toEqual({
        id: civilWar.id,
        title: "Captain America: Civil War",
      });

      const titles = res.body.order.map((m: { title: string }) => m.title);
      expect(titles).toHaveLength(3);
      expect(titles).toContain("Iron Man");
      expect(titles).toContain("Captain America: The First Avenger");
      expect(titles).toContain("The Avengers");

      // The Avengers must come after both Iron Man and First Avenger
      const avengersIndex = titles.indexOf("The Avengers");
      const ironManIndex = titles.indexOf("Iron Man");
      const firstAvengerIndex = titles.indexOf("Captain America: The First Avenger");

      expect(avengersIndex).toBeGreaterThan(ironManIndex);
      expect(avengersIndex).toBeGreaterThan(firstAvengerIndex);
      expect(res.body.summary.total).toBe(3);
    });

    it("returns empty order with summary total 0 for Thor: Ragnarok", async () => {
      const ragnarok = await prisma.movie.findUniqueOrThrow({
        where: { title: "Thor: Ragnarok" },
      });

      const res = await request(app).get(
        `/api/movies/${ragnarok.id}/rewatch-order`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        target: {
          id: ragnarok.id,
          title: "Thor: Ragnarok",
        },
        order: [],
        summary: {
          total: 0,
          watched: 0,
          unwatched: 0,
          remainingRuntimeMinutes: 0,
        },
      });
    });
  });

  describe("Rewatch order summary correctness with test data", () => {
    it("correctly calculates watched, unwatched, and remainingRuntimeMinutes", async () => {
      // Create Movie 1: runtime 100, watched: true
      const m1Res = await request(app).post("/api/movies").send({
        title: `${testPrefix}_1_Watched`,
        releaseYear: 2020,
        runtime: 100,
        watched: true,
      });
      const m1Id = registerMovie(m1Res.body.id);

      // Create Movie 2: runtime 120, watched: false, prereq: Movie 1
      const m2Res = await request(app).post("/api/movies").send({
        title: `${testPrefix}_2_Unwatched`,
        releaseYear: 2021,
        runtime: 120,
        watched: false,
        prerequisiteIds: [m1Id],
      });
      const m2Id = registerMovie(m2Res.body.id);

      // Create Movie 3: runtime 80, watched: false, prereq: Movie 2
      const m3Res = await request(app).post("/api/movies").send({
        title: `${testPrefix}_3_Target`,
        releaseYear: 2022,
        runtime: 80,
        watched: false,
        prerequisiteIds: [m2Id],
      });
      const m3Id = registerMovie(m3Res.body.id);

      // Query rewatch order for Movie 3
      const res = await request(app).get(`/api/movies/${m3Id}/rewatch-order`);

      expect(res.status).toBe(200);
      expect(res.body.target).toEqual({
        id: m3Id,
        title: `${testPrefix}_3_Target`,
      });

      // Prerequisites are Movie 1 and Movie 2 (target Movie 3 excluded)
      expect(res.body.order).toHaveLength(2);
      expect(res.body.order[0].id).toBe(m1Id);
      expect(res.body.order[1].id).toBe(m2Id);

      // Summary:
      // total: 2
      // watched: 1 (Movie 1)
      // unwatched: 1 (Movie 2)
      // remainingRuntimeMinutes: 120 (only Movie 2 runtime)
      expect(res.body.summary).toEqual({
        total: 2,
        watched: 1,
        unwatched: 1,
        remainingRuntimeMinutes: 120,
      });
    });
  });

  describe("Validation & Error handling for GET /api/movies/:id/rewatch-order", () => {
    it("returns 400 VALIDATION_ERROR on invalid :id", async () => {
      const resAlpha = await request(app).get("/api/movies/invalid-id/rewatch-order");
      expect(resAlpha.status).toBe(400);
      expect(resAlpha.body.error.code).toBe("VALIDATION_ERROR");

      const resNegative = await request(app).get("/api/movies/-1/rewatch-order");
      expect(resNegative.status).toBe(400);
      expect(resNegative.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 NOT_FOUND for a non-existent movie id", async () => {
      const res = await request(app).get("/api/movies/99999999/rewatch-order");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
