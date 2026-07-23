# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Known defects and the planned remediation order live in [ROADMAP.md](ROADMAP.md). Check it before starting structural work — Phase 4 moves most of the backend, so large refactors landed early will conflict.

## Repository layout

Two independent npm projects in one git repo — there is no workspace/monorepo tooling, so `npm install` and all scripts are run from inside each app directory:

- `ai-repurposer-backend/` — NestJS 11 API (port **3000**, hardcoded in [main.ts](ai-repurposer-backend/src/main.ts))
- `ai-repurposer-frontend/` — Next.js 16 App Router + React 19 + Tailwind 4 (must run on port **3001**)

## Commands

### Backend (`ai-repurposer-backend/`)

```bash
docker compose up -d          # Postgres 15 (:5432) + Redis 7 (:6379) — required before starting
npm run start:dev             # watch mode
npm run build && node dist/src/main   # start:prod is broken — see note below
npm run lint                  # eslint --fix
npm run format                # prettier
npm test                      # jest, *.spec.ts under src/
npm test -- jobs.service      # single test file by name pattern
npm run test:e2e              # jest --config ./test/jest-e2e.json
npx prisma migrate dev --name <name>
npx prisma generate           # required after any schema.prisma edit
npx prisma studio
```

`npm run start:prod` runs `node dist/main`, which does not exist: `prisma.config.ts` sits at the project root, so tsc's inferred `rootDir` covers the whole project and the entrypoint compiles to `dist/src/main.js`. Use `node dist/src/main` until this is fixed ([ROADMAP.md](ROADMAP.md) Phase 3).

Prisma 7: `schema.prisma` has **no `url` in the datasource block** — the connection string comes from [prisma.config.ts](ai-repurposer-backend/prisma.config.ts), which loads `DATABASE_URL` via dotenv. At runtime `PrismaService` uses the `@prisma/adapter-pg` driver adapter rather than the Rust engine's own connection handling.

Transcription fallback shells out to **`yt-dlp`**, which must be on `PATH` (`yt-dlp --js-runtimes nodejs`). Without it, only videos that already have YouTube captions will process.

### Frontend (`ai-repurposer-frontend/`)

```bash
npm run dev -- -p 3001        # MUST be 3001 — see port note below
npm run build && npm start
npm run lint
```

No test setup exists on the frontend.

### Port collision (important)

`next dev` defaults to 3000, which the backend already occupies. The backend's CORS allowlist and `FRONTEND_URL` default both assume the frontend is at `http://localhost:3001`, and `.env.local` points `NEXT_PUBLIC_API_URL` at `http://localhost:3000`. Always start the frontend with `-p 3001`.

## Architecture

### Request → queue → worker pipeline

The core flow is asynchronous and spans both processes:

1. `POST /jobs` ([jobs.controller.ts](ai-repurposer-backend/src/jobs/jobs.controller.ts)) → `JobsService.initiateJob` atomically claims a monthly quota slot, creates a `Job` row (`QUEUED`), and enqueues `process-video` on the BullMQ `repurpose-queue` (3 attempts, exponential backoff). If anything after the claim fails, the slot is released and the orphaned row deleted.
2. `JobsProcessor` ([jobs.processor.ts](ai-repurposer-backend/src/jobs/jobs.processor.ts)) — the single worker — runs: transcript (up to 3 attempts) → all four `ContentType`s generated **in parallel** via `Promise.all` → one Prisma `$transaction` that deletes prior content, inserts the new rows, and flips the job to `COMPLETED`. It is idempotent: it skips jobs already `COMPLETED` or missing from the DB.
3. The frontend watches progress over **SSE**: `GET /jobs/:id/status?token=…` polls the DB every 2s via `rxjs interval` and completes on `COMPLETED`/`FAILED`.

Because the worker runs in the same Nest process as the API, there is no separate worker entrypoint — starting the backend starts both.

### External services

- **Transcription** ([transcription.service.ts](ai-repurposer-backend/src/transcription/transcription.service.ts)): tries YouTube captions via `youtubei.js` first; falls back to downloading audio with `yt-dlp` into the OS temp dir and sending it to **Groq Whisper** (`whisper-large-v3-turbo`, 24 MB cap). The temp file is deliberately kept between retry attempts and cleaned up by the processor via `cleanupAudioFile`.
- **Text generation** ([ai.service.ts](ai-repurposer-backend/src/ai/ai.service.ts)): OpenAI SDK pointed at **OpenRouter** (`meta-llama/llama-3.1-8b-instruct`). Per-content-type prompts live in the `PROMPTS` map; the system prompt carries the target language (`Arabic` default, Modern Standard Arabic).
- **Images** ([image.service.ts](ai-repurposer-backend/src/image/image.service.ts)): OpenRouter writes a Flux-style prompt, which is embedded in a **pollinations.ai** URL and then shortened through TinyURL. No image bytes are stored — only the URL on `Job.imageUrl`.

### Auth

JWT via Passport with four strategies (`local`, `jwt`, `jwt-refresh`, `google`). Access and refresh tokens both expire in 7d and use **different secrets** (`JWT_SECRET` / `JWT_REFRESH_SECRET`); the refresh token is stored bcrypt-hashed on `User.refreshToken`. Google OAuth redirects to `${FRONTEND_URL}/auth/callback?accessToken=…&refreshToken=…`.

On the frontend, tokens live in **non-HttpOnly cookies** set by `document.cookie` (login page, OAuth callback page) — a known weakness scheduled for replacement in [ROADMAP.md](ROADMAP.md) Phase 2. All readers go through `getCookie` in [cookies.ts](ai-repurposer-frontend/src/lib/cookies.ts): [api.ts](ai-repurposer-frontend/src/lib/api.ts) for the `Authorization` header and [useJobSSE.ts](ai-repurposer-frontend/src/hooks/useJobSSE.ts) for the SSE query param. [proxy.ts](ai-repurposer-frontend/src/proxy.ts) — Next 16's rename of `middleware.ts` — gates `/dashboard` and `/login` on the cookie's presence server-side.

### Usage limiting

Two independent mechanisms, easy to confuse:

- **Plan quota** — Redis key `usage:{userId}:{YYYY-MM}` (see [plans.config.ts](ai-repurposer-backend/src/config/plans.config.ts)), expiring at the start of next month UTC. `FREE` = 1 job/month, `PRO` = `Infinity`. Claimed by `UsageService.tryConsume` from inside `JobsService`, reported by `GET /users/me`. The `User.jobsUsedThisMonth`/`usagePeriodStart` columns exist in the schema but are **not used** — Redis is the source of truth, so quota resets if Redis is flushed.

  Enforcement deliberately lives in the service, **not** a guard: Nest runs guards before pipes, so a guard would burn a user's monthly slot on requests that the `ValidationPipe` is about to reject. `tryConsume` runs INCR, the TTL and the limit check in one Lua script so concurrent requests cannot both observe the pre-increment value, and it lets Redis errors propagate so the endpoint fails closed.
- **Rate limiting** — `@nestjs/throttler`, global 10/min + 100/hr, with tighter `@Throttle` overrides on register (3/min), login (5/min), job creation (5/min), and image generation (5–10/min).

## Conventions and gotchas

- Backend imports mix relative paths (`../prisma/prisma.service`) with root-absolute ones (`src/ai/ai.service`, resolved by `baseUrl: "./"`). There is no `@/` alias on the backend.
- The module file is `src/prisma/Prisma.module.ts` (capital P) but the service is `prisma.service.ts`. Imports use both casings — this works on Windows but will break a case-sensitive filesystem.
- Frontend alias `@/*` maps to the **project root**, not `src/`, so imports read `@/src/lib/api`.
- `main.ts` registers a global `ValidationPipe({ whitelist: true, transform: true })`, so every `@Body()` needs a DTO class to be validated — an inline object type silently skips validation entirely. DTOs live in `src/jobs/dto/` and `src/auth/dto/`. Note that `whitelist` strips undecorated properties, so a field without a decorator never reaches the handler.
- Dark/light theming is threaded manually through `useTheme()` with ternaries on nearly every `className` rather than Tailwind's `dark:` variant — match that pattern when editing components.
- Dashboard components (`JobCard`, `ContentViewer`, `UsageBanner`) are `React.lazy` + `Suspense` loaded; keep new heavy components on that path.
- Both `.env` (backend) and `.env.local` (frontend) are committed-adjacent local files. Backend expects: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, and `SMTP_*` for nodemailer.
- Adding a `ContentType` requires changes in four places: the Prisma enum, `CONTENT_TYPES` in the processor, `PROMPTS` in `ai.service.ts`, and the frontend `TABS`/content components.
