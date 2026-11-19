import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("Movies API", () => {
  const testRunId = Date.now();
  const testPrefix = `TestMovie_${testRunId}`;
  const createdMovieIds: number[] = [];

  // Helper to track and register movie IDs for cleanup
  const registerMovie = (id: number) => {
    createdMovieIds.push(id);
    return id;
  };

  afterAll(async () => {
    // Only delete movies created during this test suite to preserve seeded data
    if (createdMovieIds.length > 0) {
      await prisma.movie.deleteMany({
        where: { id: { in: createdMovieIds } },
      });
    }
    // Safety cleanup for any movie starting with this test run prefix
    await prisma.movie.deleteMany({
      where: { title: { startsWith: testPrefix } },
    });
    await prisma.$disconnect();
  });

  describe("GET /api/movies", () => {
    it("returns movies ordered by id with prerequisites [{id, title}]", async () => {
      const response = await request(app).get("/api/movies");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(8);

      // Verify shape of movies
      const firstMovie = response.body[0];
      expect(firstMovie).toHaveProperty("id");
      expect(firstMovie).toHaveProperty("title");
      expect(firstMovie).toHaveProperty("releaseYear");
      expect(firstMovie).toHaveProperty("runtime");
      expect(firstMovie).toHaveProperty("watched");
      expect(firstMovie).toHaveProperty("prerequisites");
      expect(Array.isArray(firstMovie.prerequisites)).toBe(true);

      // Verify ordering by id ascending
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i].id).toBeGreaterThan(response.body[i - 1].id);
      }
    });
  });

  describe("POST /api/movies - Validation & Error handling", () => {
    it("returns 400 VALIDATION_ERROR on missing required fields", async () => {
      const res = await request(app).post("/api/movies").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when title is only whitespace", async () => {
      const res = await request(app).post("/api/movies").send({
        title: "    ",
        releaseYear: 2020,
        runtime: 120,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when releaseYear is out of range 1900-2100", async () => {
      const res1 = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Year1`,
        releaseYear: 1899,
        runtime: 120,
      });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("VALIDATION_ERROR");

      const res2 = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Year2`,
        releaseYear: 2101,
        runtime: 120,
      });
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when runtime is out of range 1-300", async () => {
      const res1 = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Runtime1`,
        releaseYear: 2020,
        runtime: 0,
      });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("VALIDATION_ERROR");

      const res2 = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Runtime2`,
        releaseYear: 2020,
        runtime: 301,
      });
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when prerequisiteIds contains duplicates or negative numbers", async () => {
      const resDuplicate = await request(app).post("/api/movies").send({
        title: `${testPrefix}_DupPrereq`,
        releaseYear: 2020,
        runtime: 120,
        prerequisiteIds: [1, 1],
      });
      expect(resDuplicate.status).toBe(400);
      expect(resDuplicate.body.error.code).toBe("VALIDATION_ERROR");

      const resNegative = await request(app).post("/api/movies").send({
        title: `${testPrefix}_NegPrereq`,
        releaseYear: 2020,
        runtime: 120,
        prerequisiteIds: [-1],
      });
      expect(resNegative.status).toBe(400);
      expect(resNegative.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when unknown fields are provided", async () => {
      const res = await request(app).post("/api/movies").send({
        title: `${testPrefix}_UnknownField`,
        releaseYear: 2020,
        runtime: 120,
        extraProp: "unsupported",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR on malformed JSON payload", async () => {
      const res = await request(app)
        .post("/api/movies")
        .set("Content-Type", "application/json")
        .send("{ malformed json ... }");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 409 DUPLICATE when creating a movie with an existing title", async () => {
      // Iron Man already exists from seed
      const res = await request(app).post("/api/movies").send({
        title: "Iron Man",
        releaseYear: 2008,
        runtime: 126,
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE");
    });

    it("returns 404 NOT_FOUND when prerequisite movie id does not exist", async () => {
      const missingId = 9999999;
      const res = await request(app).post("/api/movies").send({
        title: `${testPrefix}_MissingPrereq`,
        releaseYear: 2020,
        runtime: 120,
        prerequisiteIds: [missingId],
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe("POST /api/movies - Success cases", () => {
    it("creates a single movie and returns 201 with correct shape", async () => {
      const title = `${testPrefix}_Single`;
      const res = await request(app).post("/api/movies").send({
        title,
        releaseYear: 2022,
        runtime: 135,
        watched: false,
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe(title);
      expect(res.body.releaseYear).toBe(2022);
      expect(res.body.runtime).toBe(135);
      expect(res.body.watched).toBe(false);
      expect(res.body.prerequisites).toEqual([]);

      registerMovie(res.body.id);
    });

    it("creates an array of movies and returns 201 with an array", async () => {
      const titleA = `${testPrefix}_BatchA`;
      const titleB = `${testPrefix}_BatchB`;

      const res = await request(app)
        .post("/api/movies")
        .send([
          { title: titleA, releaseYear: 2021, runtime: 110 },
          { title: titleB, releaseYear: 2022, runtime: 120 },
        ]);

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      registerMovie(res.body[0].id);
      registerMovie(res.body[1].id);

      expect(res.body[0].title).toBe(titleA);
      expect(res.body[1].title).toBe(titleB);
    });
  });

  describe("POST /api/movies - Transaction rollback for array", () => {
    it("rolls back all items if any item in the array fails", async () => {
      const validTitle = `${testPrefix}_Rollback_Valid`;

      // Movie 1 is valid, Movie 2 has duplicate title of seeded "Iron Man"
      const res = await request(app)
        .post("/api/movies")
        .send([
          { title: validTitle, releaseYear: 2023, runtime: 100 },
          { title: "Iron Man", releaseYear: 2008, runtime: 126 },
        ]);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE");

      // Verify that validTitle was NOT saved in database
      const foundInDb = await prisma.movie.findUnique({
        where: { title: validTitle },
      });
      expect(foundInDb).toBeNull();
    });

    it("rolls back all items if an item refers to an unknown prerequisite", async () => {
      const validTitle = `${testPrefix}_Rollback_Prereq_Valid`;

      const res = await request(app)
        .post("/api/movies")
        .send([
          { title: validTitle, releaseYear: 2024, runtime: 95 },
          {
            title: `${testPrefix}_Failing_Prereq`,
            releaseYear: 2025,
            runtime: 105,
            prerequisiteIds: [88888888],
          },
        ]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");

      const foundInDb = await prisma.movie.findUnique({
        where: { title: validTitle },
      });
      expect(foundInDb).toBeNull();
    });
  });

  describe("PATCH /api/movies/:id", () => {
    it("returns 400 VALIDATION_ERROR on invalid :id", async () => {
      const res1 = await request(app)
        .patch("/api/movies/abc")
        .send({ watched: true });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("VALIDATION_ERROR");

      const res2 = await request(app)
        .patch("/api/movies/-1")
        .send({ watched: true });
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 NOT_FOUND on missing movie", async () => {
      const res = await request(app)
        .patch("/api/movies/99999999")
        .send({ watched: true });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 400 VALIDATION_ERROR on unknown fields in update", async () => {
      // Find an existing movie ID or create one
      const movieRes = await request(app).post("/api/movies").send({
        title: `${testPrefix}_PatchUnknown`,
        releaseYear: 2020,
        runtime: 120,
      });
      const id = registerMovie(movieRes.body.id);

      const res = await request(app)
        .patch(`/api/movies/${id}`)
        .send({ unknownField: "bad" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("updates watched to true successfully", async () => {
      const createRes = await request(app).post("/api/movies").send({
        title: `${testPrefix}_WatchMe`,
        releaseYear: 2021,
        runtime: 115,
        watched: false,
      });
      const id = registerMovie(createRes.body.id);
      expect(createRes.body.watched).toBe(false);

      const patchRes = await request(app)
        .patch(`/api/movies/${id}`)
        .send({ watched: true });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.id).toBe(id);
      expect(patchRes.body.watched).toBe(true);
      expect(patchRes.body.title).toBe(`${testPrefix}_WatchMe`);
      expect(patchRes.body.runtime).toBe(115);
    });

    it("replaces prerequisiteIds full set on PATCH", async () => {
      // Create two base movies
      const base1 = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Base1`,
        releaseYear: 2010,
        runtime: 100,
      });
      const base1Id = registerMovie(base1.body.id);

      const base2 = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Base2`,
        releaseYear: 2011,
        runtime: 100,
      });
      const base2Id = registerMovie(base2.body.id);

      // Create target movie with base1 as prerequisite
      const target = await request(app).post("/api/movies").send({
        title: `${testPrefix}_Target`,
        releaseYear: 2015,
        runtime: 120,
        prerequisiteIds: [base1Id],
      });
      const targetId = registerMovie(target.body.id);

      expect(target.body.prerequisites).toEqual([
        { id: base1Id, title: `${testPrefix}_Base1` },
      ]);

      // Replace prerequisites with [base2Id]
      const updateRes = await request(app)
        .patch(`/api/movies/${targetId}`)
        .send({ prerequisiteIds: [base2Id] });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.prerequisites).toEqual([
        { id: base2Id, title: `${testPrefix}_Base2` },
      ]);
    });
  });

  describe("Unknown routes", () => {
    it("returns 404 NOT_FOUND with error shape on unknown route", async () => {
      const res = await request(app).get("/api/unknown-endpoint");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Route not found",
        },
      });
    });
  });
});
