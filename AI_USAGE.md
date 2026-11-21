# AI Usage Disclosure & Development Log

I used AI tools openly in this project. Here is exactly how.

**Claude (chat), used as a mentor, not as a code writer for the core logic:**
- Helped me understand the assessment and choose the stack (Node, Express, TypeScript, PostgreSQL, Prisma).
- Explained the ideas behind the three algorithms in plain language and broke them into small steps: DFS for cycle detection, DFS post-order for the rewatch order, and bottom-up dynamic programming for the booking quote (and why greedy fails for sizes 1, 3, 4 with group size 6).
- Reviewed the code I wrote, pointed out edge cases.

**What I wrote myself:** the logic of Feature 1 and Feature 2, i.e. the three pure functions in `backend/src/algorithms/` (`wouldCreateCycle`, `getRewatchOrder`, `findMinBundles`). No library is used for them.

**Antigravity (AI coding agent), used for the rest, from prompts I reviewed step by step:**
- Project scaffolding, Prisma schema, migration and seed data
- Express routes, controllers, services, Zod validation and error handling
- The Vitest/Supertest tests, including the unit tests for my three algorithms (the agent was told not to modify my algorithm files)
- The whole React frontend, including the visual design and poster handling
- Parts of the project README

I read and tested the generated code and can explain it. The agent was instructed (see `PROJECT_CONTEXT.md`) never to implement the three algorithms.

---

## Chronological Development Log

- **2026-11-19 — Step 0: Assessment Review & Algorithm Mentorship**
  Used Claude (chat) to analyze the Blinto assessment brief, select the technology stack (Node.js, Express, TypeScript, PostgreSQL, Prisma), and study the algorithm strategies (iterative DFS for cycle detection, post-order DFS for topological rewatch sequence, and bottom-up dynamic programming for minimum bundle allocation).

- **2026-11-19 — Step 1: Backend Foundation & Scaffolding**
  Scaffolded `/backend` with Node.js, Express 5, TypeScript in strict mode, Vitest test runner, and `GET /api/health` probe endpoint. Created root `.gitignore`.

- **2026-11-19 — Step 2: Database Schema & Migration**
  Configured Prisma with PostgreSQL connection string in `backend/.env`. Authored `Movie` (with self-referencing many-to-many `_Prereqs` relation) and `Cinema` models in `schema.prisma`. Executed migration `init` on Neon cloud database and created `seed.ts` with 8 MCU movies and 4 cinemas.

- **2026-11-20 — Step 3: Movies API, Validation & Error Handling**
  Implemented `POST /api/movies`, `GET /api/movies`, and `PATCH /api/movies/:id`. Created Zod validation schemas (`movie.schema.ts`), central error handling with custom `AppError` class (mapping Prisma P2002 to 409 `DUPLICATE`), and set up algorithm stubs in `backend/src/algorithms/`.

- **2026-11-20 — Step 4: Feature 1a Algorithm & Tests (Cycle Detection)**
  Author wrote the pure cycle detection function in `backend/src/algorithms/wouldCreateCycle.ts`. Vitest unit test suite authored in `backend/tests/wouldCreateCycle.test.ts` covering 8 edge cases (direct, self, diamond, missing IDs, long chains).

- **2026-11-20 — Step 5: Feature 1b Algorithm & Tests (Rewatch Order)**
  Author wrote the pure topological sorting function in `backend/src/algorithms/getRewatchOrder.ts`. Vitest unit test suite authored in `backend/tests/getRewatchOrder.test.ts` covering 6 test cases (prerequisite validity, diamond deduplication, missing target).

- **2026-11-20 — Step 6: Integration of Feature 1 into Movies API**
  Wired `wouldCreateCycle` into `movie.service.ts` PATCH flow to reject cyclic prerequisite updates with HTTP 409 `CIRCULAR_DEPENDENCY`. Added `GET /api/movies/:id/rewatch-order` endpoint computing topological order and summary statistics. Integration tests verified in `backend/tests/rewatchOrder.test.ts`.

- **2026-11-20 — Step 7: Feature 2 Algorithm & Tests (Minimum Bundles)**
  Author wrote the pure dynamic programming function in `backend/src/algorithms/findMinBundles.ts`. Vitest unit test suite authored in `backend/tests/findMinBundles.test.ts` covering 9 cases (assessment examples, greedy trap, immutability, large inputs).

- **2026-11-20 — Step 8: Cinema API & Booking Endpoint**
  Implemented `POST /api/cinemas`, `GET /api/cinemas`, and `GET /api/cinemas/:id/booking?groupSize=`. Added Zod validation schemas (`cinema.schema.ts`) and full integration tests in `backend/tests/cinemas.test.ts`.

- **2026-11-21 — Step 9: Frontend Architecture & Foundation**
  Created `/frontend` using React 19, TypeScript, Vite 8, and Tailwind CSS 4. Configured Vite dev proxy to forward `/api` to `http://localhost:3000`. Built tabbed views for Movies, Rewatch Plan, and Cinema Booking with modal dialogues.

- **2026-11-21 — Step 10: Visual Polish & Media Assets**
  Added local official theatrical posters in `/frontend/public/posters/`, built `MoviePoster.tsx` component with fallback styling, and implemented responsive horizontal media cards with Marvel Studios aesthetic.

- **2026-11-21 — Step 11: Read-Only Audit & Documentation**
  Conducted read-only audit of project status, verified all 74 backend tests pass and production builds succeed, authored final `README.md` and updated `AI_USAGE.md`.
