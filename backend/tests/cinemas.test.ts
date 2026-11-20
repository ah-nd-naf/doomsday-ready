import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

describe("Cinemas API & Booking", () => {
  const testRunId = Date.now();
  const testPrefix = `CinemaTest_${testRunId}`;
  const createdCinemaIds: number[] = [];

  const registerCinema = (id: number) => {
    createdCinemaIds.push(id);
    return id;
  };

  afterAll(async () => {
    // Only delete test-created cinemas to preserve seeded data
    if (createdCinemaIds.length > 0) {
      await prisma.cinema.deleteMany({
        where: { id: { in: createdCinemaIds } },
      });
    }
    await prisma.cinema.deleteMany({
      where: { name: { startsWith: testPrefix } },
    });
    await prisma.$disconnect();
  });

  describe("GET /api/cinemas", () => {
    it("returns all cinemas ordered by id with { id, name, bundleSizes }", async () => {
      const res = await request(app).get("/api/cinemas");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);

      // Verify shape
      const first = res.body[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("bundleSizes");
      expect(Array.isArray(first.bundleSizes)).toBe(true);

      // Verify ordering by id ascending
      for (let i = 1; i < res.body.length; i++) {
        expect(res.body[i].id).toBeGreaterThan(res.body[i - 1].id);
      }
    });
  });

  describe("GET /api/cinemas/:id/booking assessment examples via seeded cinemas", () => {
    it("Test Cinema A [1, 3, 4] with group 6 returns 2 bundles (3x2)", async () => {
      const cinemaA = await prisma.cinema.findUniqueOrThrow({
        where: { name: "Test Cinema A" },
      });

      const res = await request(app).get(
        `/api/cinemas/${cinemaA.id}/booking?groupSize=6`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        cinema: {
          id: cinemaA.id,
          name: "Test Cinema A",
        },
        groupSize: 6,
        possible: true,
        totalBundles: 2,
        bundles: [{ size: 3, count: 2 }],
      });
    });

    it("Test Cinema B [2, 5] with group 11 returns 4 bundles (5x1, 2x3)", async () => {
      const cinemaB = await prisma.cinema.findUniqueOrThrow({
        where: { name: "Test Cinema B" },
      });

      const res = await request(app).get(
        `/api/cinemas/${cinemaB.id}/booking?groupSize=11`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        cinema: {
          id: cinemaB.id,
          name: "Test Cinema B",
        },
        groupSize: 11,
        possible: true,
        totalBundles: 4,
        bundles: [
          { size: 5, count: 1 },
          { size: 2, count: 3 },
        ],
      });
    });

    it("Test Cinema C [6, 9, 20] with group 44 returns 4 bundles (20x1, 9x2, 6x1)", async () => {
      const cinemaC = await prisma.cinema.findUniqueOrThrow({
        where: { name: "Test Cinema C" },
      });

      const res = await request(app).get(
        `/api/cinemas/${cinemaC.id}/booking?groupSize=44`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        cinema: {
          id: cinemaC.id,
          name: "Test Cinema C",
        },
        groupSize: 44,
        possible: true,
        totalBundles: 4,
        bundles: [
          { size: 20, count: 1 },
          { size: 9, count: 2 },
          { size: 6, count: 1 },
        ],
      });
    });

    it("Test Cinema D [4, 6] with group 7 returns possible: false with HTTP 200", async () => {
      const cinemaD = await prisma.cinema.findUniqueOrThrow({
        where: { name: "Test Cinema D" },
      });

      const res = await request(app).get(
        `/api/cinemas/${cinemaD.id}/booking?groupSize=7`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        cinema: {
          id: cinemaD.id,
          name: "Test Cinema D",
        },
        groupSize: 7,
        possible: false,
        message: "No exact combination of bundles adds up to 7 seats",
      });
    });
  });

  describe("POST /api/cinemas - Validation errors", () => {
    it("returns 400 VALIDATION_ERROR for empty bundleSizes", async () => {
      const res = await request(app).post("/api/cinemas").send({
        name: `${testPrefix}_EmptySizes`,
        bundleSizes: [],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for more than 10 bundleSizes", async () => {
      const res = await request(app)
        .post("/api/cinemas")
        .send({
          name: `${testPrefix}_ElevenSizes`,
          bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for bundle size 0", async () => {
      const res = await request(app).post("/api/cinemas").send({
        name: `${testPrefix}_ZeroSize`,
        bundleSizes: [0, 5],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for bundle size 501", async () => {
      const res = await request(app).post("/api/cinemas").send({
        name: `${testPrefix}_TooBigSize`,
        bundleSizes: [501],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for duplicate bundle sizes", async () => {
      const res = await request(app).post("/api/cinemas").send({
        name: `${testPrefix}_DupSizes`,
        bundleSizes: [2, 5, 2],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for empty or whitespace name", async () => {
      const res1 = await request(app).post("/api/cinemas").send({
        name: "",
        bundleSizes: [2, 5],
      });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("VALIDATION_ERROR");

      const res2 = await request(app).post("/api/cinemas").send({
        name: "     ",
        bundleSizes: [2, 5],
      });
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for unknown fields", async () => {
      const res = await request(app).post("/api/cinemas").send({
        name: `${testPrefix}_ExtraField`,
        bundleSizes: [2, 5],
        extra: "unsupported",
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/cinemas - Duplicate name and array transaction rollback", () => {
    it("returns 409 DUPLICATE when attempting to create a cinema with existing name", async () => {
      const res = await request(app).post("/api/cinemas").send({
        name: "Test Cinema A",
        bundleSizes: [1, 3, 4],
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE");
    });

    it("rolls back all items in an array POST if any item fails", async () => {
      const uniqueName = `${testPrefix}_RollbackCinema`;

      const res = await request(app)
        .post("/api/cinemas")
        .send([
          { name: uniqueName, bundleSizes: [2, 4] },
          { name: "Test Cinema A", bundleSizes: [1, 3] }, // Duplicate of seeded cinema
        ]);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE");

      // Verify that uniqueName was rolled back and not saved
      const found = await prisma.cinema.findUnique({
        where: { name: uniqueName },
      });
      expect(found).toBeNull();
    });

    it("successfully creates cinema(s) with 201", async () => {
      const name = `${testPrefix}_Success`;
      const res = await request(app).post("/api/cinemas").send({
        name,
        bundleSizes: [5, 10, 25],
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe(name);
      expect(res.body.bundleSizes).toEqual([5, 10, 25]);

      registerCinema(res.body.id);
    });
  });

  describe("GET /api/cinemas/:id/booking - Validation & Error handling", () => {
    let cinemaId: number;

    it("setup: get test cinema id", async () => {
      const c = await prisma.cinema.findUniqueOrThrow({
        where: { name: "Test Cinema A" },
      });
      cinemaId = c.id;
    });

    it("returns 400 VALIDATION_ERROR for groupSize 0", async () => {
      const res = await request(app).get(
        `/api/cinemas/${cinemaId}/booking?groupSize=0`
      );
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for groupSize 10001", async () => {
      const res = await request(app).get(
        `/api/cinemas/${cinemaId}/booking?groupSize=10001`
      );
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for non-integer groupSize 'abc'", async () => {
      const res = await request(app).get(
        `/api/cinemas/${cinemaId}/booking?groupSize=abc`
      );
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for missing groupSize parameter", async () => {
      const res = await request(app).get(`/api/cinemas/${cinemaId}/booking`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for invalid cinema id", async () => {
      const res1 = await request(app).get("/api/cinemas/invalid-id/booking?groupSize=5");
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("VALIDATION_ERROR");

      const res2 = await request(app).get("/api/cinemas/-2/booking?groupSize=5");
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 NOT_FOUND for non-existent cinema id", async () => {
      const res = await request(app).get("/api/cinemas/99999999/booking?groupSize=5");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
