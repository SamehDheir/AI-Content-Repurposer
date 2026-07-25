# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Known defects and the planned remediation order live in [ROADMAP.md](ROADMAP.md). Check it before starting structural work — Phase 4 moves most of the backend, so large refactors landed early will conflict.

## Repository layout

Two independent npm projects in one git repo — there is no workspace/monorepo tooling, so `npm install` and all scripts are run from inside each app directory:

- `ai-repurposer-backend/` — NestJS 11 API on port **3001** (`process.env.PORT ?? 3001`)
- `ai-repurposer-frontend/` — Next.js 16 App Router + React 19 + Tailwind 4 on port **3000** (Next's default)

## Commands

### Backend (`ai-repurposer-backend/`)

```bash
docker compose up -d          # Postgres on :5434, Redis on :6380 (not the defaults — see below)
docker compose --profile apps up -d --build   # also build and run both apps
npm run start:dev             # watch mode, :3001
npm run build && npm run start:prod
npm run lint                  # eslint --fix
npm run format                # prettier
npm test                      # jest, *.spec.ts under src/
npm test -- jobs.service      # single test file by name pattern
npm run test:e2e              # jest --config ./test/jest-e2e.json
npx prisma migrate dev --name <name>
npx prisma generate           # required after any schema.prisma edit
npx prisma studio
```

**Compose deliberately avoids the default database ports.** Postgres is published on **5434** and Redis on **6380**, because a native Windows PostgreSQL 18 install also binds `localhost:5432` and silently wins the loopback — the app would talk to the native server while the container sat unused. If `DATABASE_URL` ever points at 5432 again, confirm which server answers before trusting `docker exec … psql`:

```bash
node -e "require('dotenv/config');const{Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();console.log((await c.query('select current_database(),version()')).rows[0]);await c.end()})()"
```

Migration history is a single squashed baseline (`20260723140000_init`) that reproduces the whole schema on an empty database. The previous history was never committed — `prisma/migrations` was gitignored — so the schema had drifted via `db push` and no migration described the `User` table, the `Plan` enum, `Job.userId` or `Job.imageUrl`. `migrate deploy` from scratch and `migrate dev` both work now; keep it that way by committing every migration.

Prisma 7: `schema.prisma` has **no `url` in the datasource block** — the connection string comes from [prisma.config.ts](ai-repurposer-backend/prisma.config.ts), which loads `DATABASE_URL` via dotenv. At runtime `PrismaService` uses the `@prisma/adapter-pg` driver adapter rather than the Rust engine's own connection handling.

Transcription fallback shells out to **`yt-dlp`**, which must be on `PATH` (`yt-dlp --js-runtimes nodejs`). Without it, only videos that already have YouTube captions will process — `TranscriptionService.onModuleInit` logs a warning at boot if it is missing. The backend Docker image installs it along with Python.

### Frontend (`ai-repurposer-frontend/`)

```bash
npm run dev                   # :3000 — port is pinned, see Ports below
npm run build && npm start
npm run lint
```

No test setup exists on the frontend.

### Ports

Frontend **3000**, backend **3001**. Four settings have to agree, and getting one wrong produces a CORS failure or a silently unauthenticated app:

| Setting | Value |
|---|---|
| backend listen | `PORT` (default 3001) |
| backend `CORS_ORIGINS` | `http://localhost:3000` |
| backend `FRONTEND_URL` | `http://localhost:3000` (verification and reset links) |
| backend `GOOGLE_CALLBACK_URL` | `http://localhost:3001/auth/google/callback` |
| frontend `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |

**The frontend scripts pin `-p 3000` on purpose.** Without an explicit port, `next dev` silently falls back to the next free one when 3000 is taken — which is **3001**, the backend's port. It then wins the race against a still-compiling Nest, the API dies on `EADDRINUSE` in the background, and every call from the browser hits the Next server instead: uniform `500 Internal Server Error` with no CORS headers on every endpoint, including `OPTIONS`. With `-p 3000` Next fails loudly instead. If the symptom ever reappears, check who actually owns the port before suspecting CORS:

```bash
netstat -ano | grep ":3001.*LISTENING"     # → PID
powershell -Command "Get-CimInstance Win32_Process -Filter 'ProcessId=<PID>' | Select -Expand CommandLine"
```

Note also that `rm -rf .next` or a `next build` while `next dev` is running leaves the dev server serving 500s, and can truncate `.next/dev/types/routes.d.ts` — which is in `tsconfig.json`'s `include`, so the *next* build then fails with a bogus `Declaration or statement expected` in generated code. Stop the dev server first.

## Architecture

### Request → queue → worker pipeline

The core flow is asynchronous and spans both processes:

1. `POST /jobs` ([jobs.controller.ts](ai-repurposer-backend/src/jobs/jobs.controller.ts)) → `JobsService.initiateJob` atomically claims a monthly quota slot, creates a `Job` row (`QUEUED`), and enqueues `process-video` on the BullMQ `repurpose-queue` (3 attempts, exponential backoff). If anything after the claim fails, the slot is released and the orphaned row deleted.
2. `JobsProcessor` ([jobs.processor.ts](ai-repurposer-backend/src/jobs/jobs.processor.ts)) — the single worker — runs: transcript (up to 3 attempts) → all four `ContentType`s generated **in parallel** via `Promise.all` → one Prisma `$transaction` that deletes prior content, inserts the new rows, and flips the job to `COMPLETED`. It is idempotent: it skips jobs already `COMPLETED` or missing from the DB.
3. The frontend watches progress over **SSE**: `GET /jobs/:id/status` (authenticated by the same cookie guard as every other route) polls the DB every 2s via `rxjs interval` and completes on `COMPLETED`/`FAILED`.

Because the worker runs in the same Nest process as the API, there is no separate worker entrypoint — starting the backend starts both.

### External services

- **Transcription** ([transcription.service.ts](ai-repurposer-backend/src/transcription/transcription.service.ts)): tries YouTube captions via `youtubei.js` first; falls back to downloading audio with `yt-dlp` into the OS temp dir and sending it to **Groq Whisper** (`whisper-large-v3-turbo`, 24 MB cap). The temp file is deliberately kept between retry attempts and cleaned up by the processor via `cleanupAudioFile`.
- **Text generation** ([ai.service.ts](ai-repurposer-backend/src/ai/ai.service.ts)): OpenAI SDK pointed at **OpenRouter** (`meta-llama/llama-3.1-8b-instruct`). Per-content-type prompts live in the `PROMPTS` map; the system prompt carries the target language (`Arabic` default, Modern Standard Arabic).
- **Images** ([image.service.ts](ai-repurposer-backend/src/image/image.service.ts)): OpenRouter writes a Flux-style prompt, which is embedded in a **pollinations.ai** URL and then shortened through TinyURL. No image bytes are stored — only the URL on `Job.imageUrl`.

### Auth

JWT via Passport with four strategies (`local`, `jwt`, `jwt-refresh`, `google`). Access tokens live **15 minutes**, refresh tokens **7 days**, under different secrets (`JWT_SECRET` / `JWT_REFRESH_SECRET`); the refresh token is stored bcrypt-hashed on `User.refreshToken`.

**Tokens are HttpOnly cookies and are never visible to JavaScript.** They are set server-side by [cookies.ts](ai-repurposer-backend/src/auth/cookies.ts) on login, refresh and the Google callback, and cleared on logout. Consequences worth internalising before touching this code:

- **No response body ever contains a token**, and no client code may set one. `document.cookie` must not reappear anywhere in the frontend.
- **The bearer header is not accepted.** `JwtStrategy` reads the `accessToken` cookie only, so `curl` needs a cookie jar (`-c`/`-b`), not `Authorization`.
- Every frontend request sends `credentials: 'include'` ([api.ts](ai-repurposer-frontend/src/lib/api.ts)). Because credentialed CORS forbids a wildcard origin, `CORS_ORIGINS` must list the frontend origin exactly.
- `api.ts` retries once through `POST /auth/refresh` on a 401, sharing a single in-flight refresh so a burst of parallel 401s rotates the token once. `/auth/login`, `/auth/register` and `/auth/refresh` are excluded to avoid a loop.
- [proxy.ts](ai-repurposer-frontend/src/proxy.ts) gates `/dashboard` and `/login` on the **refresh** cookie, not the access cookie — the latter expires every 15 minutes and would bounce active users to the login page.
- Cookie attributes come from env: `COOKIE_SAMESITE` (default `lax`), `COOKIE_SECURE` (default: on in production), `COOKIE_DOMAIN`. A cross-domain deployment needs `COOKIE_SAMESITE=none`, which forces `Secure`, requires HTTPS, and gives up the CSRF protection `Lax` provides for free — that setup would need CSRF tokens.

**Email verification is enforced at login.** `validateUser` rejects unverified accounts with 403, so `register` deliberately returns a message rather than a session. Verification tokens expire after 24h, and `POST /auth/resend-verification` exists so an expired token is not a dead end. Google accounts are pre-verified. Accounts predating enforcement were backfilled to verified by `20260723120000_email_verification_expiry_and_grandfather`.

### Usage limiting

Two independent mechanisms, easy to confuse:

- **Plan quota** — Redis key `usage:{userId}:{YYYY-MM}` (see [plans.config.ts](ai-repurposer-backend/src/config/plans.config.ts)), expiring at the start of next month UTC. `FREE` = 1 job/month, `PRO` = `Infinity`. Claimed by `UsageService.tryConsume` from inside `JobsService`, reported by `GET /users/me`. The `User.jobsUsedThisMonth`/`usagePeriodStart` columns exist in the schema but are **not used** — Redis is the source of truth, so quota resets if Redis is flushed.

  Enforcement deliberately lives in the service, **not** a guard: Nest runs guards before pipes, so a guard would burn a user's monthly slot on requests that the `ValidationPipe` is about to reject. `tryConsume` runs INCR, the TTL and the limit check in one Lua script so concurrent requests cannot both observe the pre-increment value, and it lets Redis errors propagate so the endpoint fails closed.
- **Rate limiting** — `@nestjs/throttler`, global 10/min + 100/hr, with tighter `@Throttle` overrides on register (3/min), login (5/min), job creation (5/min), and image generation (5–10/min).

## Conventions and gotchas

- Backend imports mix relative paths (`../prisma/prisma.service`) with root-absolute ones (`src/ai/ai.service`, resolved by `baseUrl: "./"`). There is no `@/` alias on the backend.
- Backend filenames are all lowercase. `Prisma.module.ts` was renamed to `prisma.module.ts` because the mixed-casing imports only worked on Windows and broke on a case-sensitive filesystem — keep new files lowercase.
- Frontend alias `@/*` maps to the **project root**, not `src/`, so imports read `@/src/lib/api`.
- `main.ts` registers a global `ValidationPipe({ whitelist: true, transform: true })`, so every `@Body()` needs a DTO class to be validated — an inline object type silently skips validation entirely. DTOs live in `src/jobs/dto/` and `src/auth/dto/`. Note that `whitelist` strips undecorated properties, so a field without a decorator never reaches the handler.
- Dashboard components (`JobCard`, `ContentViewer`, `UsageBanner`) are `React.lazy` + `Suspense` loaded; keep new heavy components on that path.

### The design system ("Cutting Room")

The marketing page, the dashboard and the auth pages share one system defined in [globals.css](ai-repurposer-frontend/src/app/globals.css). Read it before styling anything new.

- **Theming is token-driven, not ternary-driven.** `.dark` / `.light` on `<html>` swap CSS variables, and `@theme inline` turns them into ordinary utilities: `bg-paper`, `bg-surface`, `text-ink` / `text-ink-2` / `text-ink-3`, `border-rule` / `border-rule-strong`, `text-signal`, `bg-signal-wash`, `bg-scrim`. Use those. Do **not** reintroduce `theme === 'dark' ? … : …` per-`className` ternaries — the older auth-adjacent pages (`forgot-password`, `reset-password`, `verify-email`, `auth/callback`) still do it and are the exception, not the pattern. `useTheme()` remains for behaviour (the toggle); the toggle's own icons swap via `.only-dark` / `.only-light` so they are right on first paint.
- **`--signal-on-ink` exists for inverted bands.** On `bg-ink` the background is the *other* theme's paper, so a normal `text-signal` goes muddy. The homepage ticker and the login side panel use it.
- **Four riso inks, one per output format** — `--fmt-thread`, `--fmt-blog`, `--fmt-social`, `--fmt-marks`. They appear as hairlines, dots and small rules only, never as gradients, and the same colour tracks a format from the homepage specimen to the ledger row to the viewer's index tab.
- **Type**: `.display` (Newsreader, the editorial serif — add `.display-xl` for settings above ~2.5rem), `.label` (11px mono caps, 0.13em, the metadata slug that opens most blocks), `.slug` (mono, tabular, for URLs, ids and timecodes). Newsreader replaced Instrument Serif because a high-contrast display face went faint at small sizes and on the dark theme.
- **Motion** lives in `cr-*` keyframes in globals.css and is applied via inline `style={{ animation: … }}` or the `.anim-*` helpers. Scroll reveals go through `<Reveal>` / `useReveal`, which shares one IntersectionObserver across the page. Everything is disabled under `prefers-reduced-motion`.
- Corners are square (or ≤2px), depth is a hard offset shadow (`.plate`, or `shadow-[4px_4px_0_var(--rule-strong)]`) rather than a blur, and `.hatch` / `.gridlines` / `.regmark` supply the print furniture.
- `layout.tsx` runs a pre-paint inline script that sets the theme class before React hydrates; without it the whole page flashes in the wrong theme.
- Both `.env` (backend) and `.env.local` (frontend) are committed-adjacent local files. Backend expects: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, and `SMTP_*` for nodemailer.
- Adding a `ContentType` requires changes in four places: the Prisma enum, `CONTENT_TYPES` in the processor, `PROMPTS` in `ai.service.ts`, and the frontend `TABS`/content components.
