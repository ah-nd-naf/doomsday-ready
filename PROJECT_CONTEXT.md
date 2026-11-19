# Doomsday Ready: Project Context (agent must read this before every task)

## What this is
Internship assessment for Blinto (Full Stack Developer). A small full-stack app: MCU fans plan a rewatch before "Avengers: Doomsday" and book an opening-night watch party. Deadline: 21 Nov 2026. Quality, correctness and explainability matter, because the author will be interviewed on every decision.

## Stack (final, do not change)
- Backend: Node.js + Express + TypeScript, PostgreSQL, Prisma ORM (use latest stable; follow official docs), Zod for input validation, Vitest for tests
- Frontend: React + Vite + TypeScript (+ Tailwind CSS)
- Docker Compose (bonus): postgres + backend + frontend, one command start
- Layout: monorepo -> /backend, /frontend, docker-compose.yml, README.md, PROJECT_CONTEXT.md, AI_USAGE.md

## HARD RULES from the assessment
1. Work must be the author's own. AI use must be disclosed in README.
2. Logic for Feature 1 (cycle detection, rewatch order/toposort) and Feature 2 (min-bundle booking) MUST be hand-written. NO graph, toposort or DP/optimization libraries. Do NOT use Prisma recursive queries for graph logic.
3. Algorithms are PURE functions in /backend/src/algorithms/. They take plain data (arrays/maps) and never import Prisma/Express. The service layer loads data from DB and passes it in.
4. Unclear points: make a reasonable choice and record it in README "Assumptions".
5. All API routes live under /api.

## Data model
Movie: id (Int, autoincrement), title (String, UNIQUE), releaseYear (Int), runtime (Int, 1-300), watched (Boolean, default false), prerequisites (self-relation many-to-many: Movie[] "Prereqs"), requiredBy (inverse side)
Cinema: id (Int, autoincrement), name (String, UNIQUE), bundleSizes (Int[])

## Validation rules
- Movie: title non-empty trimmed unique; releaseYear integer 1900-2100 (assumption); runtime integer 1-300; watched boolean optional
- prerequisiteIds: array of existing movie ids, no duplicates; unknown id -> 400/404
- Cinema: name unique non-empty; bundleSizes: 1-10 DISTINCT integers, each 1-500 (duplicates are rejected)
- Booking: groupSize integer 1-10000

## API (all under /api)
- POST /movies: body { title, releaseYear, runtime, prerequisiteIds?, watched? }
- GET /movies: list, each with prerequisites [{id,title}]
- PATCH /movies/:id: partial update incl. watched and prerequisiteIds (replaces the full set)
- GET /movies/:id/rewatch-order -> { target:{id,title}, order:[{id,title,releaseYear,runtime,watched}], summary:{total, watched, unwatched, remainingRuntimeMinutes} }
- POST /cinemas, GET /cinemas
- GET /cinemas/:id/booking?groupSize=6 -> { cinema:{id,name}, groupSize, possible:true, totalBundles, bundles:[{size,count}] } or { ..., possible:false, message }
- Error shape: { error: { code, message, details? } }
- Codes: 400 VALIDATION_ERROR, 404 NOT_FOUND, 409 DUPLICATE (unique title/name), 409 CIRCULAR_DEPENDENCY

## Algorithm specs
### Cycle detection
A movie can never depend on itself directly or indirectly. When setting prerequisites P for movie M: if M is in P -> cycle. Else DFS from every p in P following prerequisite edges; if M is reachable -> cycle -> 409 CIRCULAR_DEPENDENCY. Nothing may be saved on failure.
### Rewatch order
Given target T: collect all direct+indirect prerequisites, each exactly once, DFS post-order (prerequisites before dependents), visited set, exclude T. Summary: total count, watched count, sum of runtime of unwatched ones. Target with no prerequisites -> empty list.
### Booking (min bundles, exact sum)
Bottom-up DP (NOT greedy, greedy fails for sizes [1,3,4], group 6). dp[0]=0, others Infinity; lastUsed[n] stores the size chosen. Loop sizes in ascending order and update only on strictly smaller count (deterministic tie-break). Unreachable -> not possible. Reconstruct counts via lastUsed.

## Test cases (from assessment, must pass)
Rewatch (sample data: Iron Man; Captain America: The First Avenger; The Avengers [Iron Man, First Avenger]; Civil War [Avengers]; Thor: Ragnarok; Infinity War [Civil War, Ragnarok]; Endgame [Infinity War]; Doomsday [Endgame]):
- Doomsday -> 7 movies in a valid order; Civil War -> Iron Man + First Avenger (any order) then The Avengers; Ragnarok -> []
- Making Endgame a prerequisite of Iron Man -> 409 CIRCULAR_DEPENDENCY
Booking:
- [1,3,4], 6 -> 2 bundles (3x2); [2,5], 11 -> 4 bundles (5x1, 2x3); [6,9,20], 44 -> 4 bundles (20x1, 9x2, 6x1); [4,6], 7 -> not possible

## Working rules for the AI agent
- Do ONE task at a time, exactly what the prompt says. No extra features.
- Never write the algorithms in /backend/src/algorithms/ unless the prompt explicitly says so; review and test them instead.
- Keep code simple and readable with short comments; the author must be able to explain everything.
- After each task: list the files changed and how to run/verify.