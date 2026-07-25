# Roadmap

Remediation and reorganization plan for `ai-repurposer`. Phases are ordered so each
one is safe to ship on its own. Structural file moves come last, after behavior is
correct, so that logic diffs stay reviewable.

Status: ✅ done · ⬜ not started

---

## Phase 1 — Broken behavior ✅

Defects users could hit. All verified against a live Postgres + Redis.

| # | Problem | Resolution |
|---|---|---|
| 1 | **SSE never authenticated.** `useJobSSE` read `localStorage.getItem('accessToken')` while every other path stored tokens in cookies, so it sent `token=null`, got 401, and closed. Job cards never live-updated. | `getCookie` extracted to `src/lib/cookies.ts`, used by both `api.ts` and `useJobSSE`. ✅ |
| 1b | **SSE re-subscribed on every render.** The hook depended on `onUpdate`, which the dashboard passes as an inline arrow — new identity each render tore down and reopened the `EventSource`. | Callback held in a ref; deps reduced to `[jobId]`. ✅ |
| 2 | **No input validation anywhere.** `CreateJobDto` existed but was never imported, and no global `ValidationPipe` was registered, so no `class-validator` decorator ever ran. | `ValidationPipe({ whitelist: true, transform: true })` in `main.ts`, plus 7 DTOs (2 jobs, 5 auth). ✅ |
| 3 | **Errors surfaced as 500s.** `jobs.controller.ts` threw bare `new Error(...)`. `GET /jobs/:id` also returned `200 null` for unknown IDs. | `NotFoundException` / `BadRequestException`; unknown IDs now 404. ✅ |
| 4 | **Free quota was bypassable.** The guard read the counter, then the service incremented it *after* enqueueing — concurrent requests all read the pre-increment value. Redis errors were swallowed and returned `0`, failing **open**. | Single Lua script does INCR + EXPIREAT + limit check + DECR-on-overflow atomically. Redis errors propagate (fails closed). `release()` rolls back if enqueue fails. ✅ |
| 5 | **Two PrismaClients.** `JobsModule` re-provided `PrismaService` despite `PrismaModule` being `@Global`, creating a second connection pool. | Removed from `JobsModule.providers`. ✅ |
| — | Dead code: `transcriptSuccess` (assigned, never read), `renderBlogHTML` (returned `[]`). | Deleted. ✅ |

### Deviation from the original plan

Item 4 was first implemented inside `UsageLimitGuard`. **This was wrong.** Nest runs
guards *before* pipes, so a request that failed validation still burned the user's
monthly slot — on a FREE plan (limit 1) one typo'd URL locked the user out for the month.
Testing caught it.

Consuming quota in a guard is structurally unsound once validation exists. Enforcement
moved into `JobsService.initiateJob`, which runs after the `ValidationPipe`, and
`src/guards/usage-limit.guard.ts` was deleted since quota was its only responsibility.

> If a declarative guard is wanted back later, it must be **read-only** (a fast-fail UX
> nicety) with the authoritative atomic consume staying in the service.

### Verification performed

- 8/8 regression checks pass, including *rejected requests leave the quota counter untouched* — the assertion that caught the guard bug.
- Race test: 5 simultaneous job creations from one FREE user → `201, 403, 403, 403, 403`, counter lands at exactly `1`.
- SSE streams live job status with a valid token; 401s without one.
- Both apps build; `tsc --noEmit` clean on both.

### Behavior changes shipped

- Register and password-reset require 8+ character passwords. Login is unaffected, so existing accounts still work.
- Non-YouTube URLs are rejected with 400 instead of being queued and failing in the worker.

### Fixed opportunistically

`npm run build` on the frontend was failing on `/auth/callback`, `/reset-password`, and
`/verify-email` — `useSearchParams()` without a Suspense boundary. This blocked verifying
Phase 1, so all three were wrapped.

---

## Phase 2 — Auth and security ✅

The token model is the weak point, and most of it is one coherent migration rather than
several independent fixes.

### The core migration

JWTs are written with `document.cookie`, so any script on the page can read them — an XSS
becomes full account takeover. The access and refresh tokens also share an identical 7-day
lifetime, which makes refresh pointless, and the frontend never calls `/auth/refresh` at
all — there is no 401 handler in `api.ts`.

- [x] Backend sets `HttpOnly; SameSite=Lax` cookies via `res.cookie()` on login, refresh and the Google callback, and clears them on logout. `cookie-parser` added; both JWT strategies extract from cookies. The bearer header is **no longer accepted**.
- [x] Access token dropped to 15 minutes; refresh stays 7 days.
- [x] Frontend `document.cookie` writes all removed; `fetch` uses `credentials: 'include'`. `src/lib/cookies.ts` deleted — HttpOnly cookies are unreadable from JS.
- [x] `request()` in `api.ts` retries once through `POST /auth/refresh` on a 401, sharing a single in-flight refresh so parallel 401s rotate the token once.
- [x] OAuth callback sets cookies server-side and redirects to a bare `/auth/callback`; no tokens in the query string.
- [x] Registration no longer returns a session, since verification is now enforced.

`proxy.ts` was **not** unchanged as originally assumed: it gated on the access cookie, which now expires every 15 minutes and would have bounced active users to the login page. It now gates on the refresh cookie.

### Smaller items

- [x] **SSE token in query string** removed; the route uses the standard cookie guard and `EventSource` sends credentials.
- [x] **`emailVerified` enforced** in `validateUser` (403). Existing accounts were grandfathered to verified so enforcement would not lock them out. *(That backfill migration was later folded into the Phase 3 squashed baseline; it is a no-op on a fresh database, which has no rows to grandfather.)* `POST /auth/resend-verification` added so an expired token is not a dead end.
- [x] **Verification tokens now expire** after 24h via `emailVerificationExpires`.
- [x] **CORS** driven by `CORS_ORIGINS`; the `https://your-domain.com` placeholder is gone.

### Found during review of this phase

Two defects in the new code, both caught before commit:

- **Google sign-in did not verify a linked account.** Signing in with Google against an address that had registered by password linked the `googleId` but left `emailVerified` false, so password login kept failing with 403. Completing Google's flow proves control of the address, so it now sets verified.
- **Password reset stranded unverified accounts.** An unverified user could reset their password and still be refused at login, with no way out. Receiving the reset link proves address control, so a successful reset now also verifies. Confirmed: login goes 403 → 200 across a reset.

### Verification performed

22/22 automated checks, covering: registration issues no session and leaks no token, unverified login is refused, verification token carries an expiry and cannot be replayed, login sets `HttpOnly` `SameSite=Lax` cookies with no token in the body, cookie auth succeeds while the bearer header is refused, token lifetimes are exactly 15m/7d (decoded from the JWTs), refresh rotates from the cookie, SSE refuses an unauthenticated stream, and logout expires the cookies server-side. The interceptor path (401 → refresh → replay) and a live cookie-authenticated SSE stream were exercised separately.

### Deployment caveat

`proxy.ts` reads the backend's cookies because both apps are on `localhost` and **cookies ignore port**. Split the apps across domains and the Next server stops seeing them, so route gating breaks and `COOKIE_SAMESITE=none` becomes mandatory — which requires HTTPS and forfeits the CSRF protection `Lax` gives for free. A cross-domain deployment needs CSRF tokens and a different gating strategy.

---

## Phase 3 — Deploy readiness ✅

- [x] **🔴 Migration history did not describe the schema.** Root cause: `.gitignore` contained `/prisma/migrations`, so **no migration was ever committed** — the schema had been evolved with `db push` and nothing described the `User` table, the `Plan` enum, `Job.userId` or `Job.imageUrl`. Since the history had never been shared, it was squashed to a single baseline (`20260723140000_init`) generated from the live schema. The dev database's `_prisma_migrations` rows were replaced with `migrate resolve --applied` (metadata only — 11 users and 9 jobs untouched). Verified: `migrate deploy` against an empty database produces a schema with **zero drift** from `schema.prisma`, the app boots against it, and `migrate dev` no longer demands a reset.
- [x] **🔴 The dev database was not the one in `docker-compose.yml`.** A native Windows PostgreSQL 18 also bound `localhost:5432` and won the loopback, so the container sat unused while the app talked to the native server. Compose is now authoritative: Postgres publishes on **5434**, Redis on **6380**, and `POSTGRES_DB` matches `DATABASE_URL`. Shifting off the default ports is what makes the collision impossible rather than merely unlikely.
- [x] **`Prisma.module.ts`** renamed to `prisma.module.ts`; both importers updated.
- [x] **`npm run start:prod`** fixed by setting an explicit `rootDir` and excluding `prisma.config.ts` from `tsconfig.build.json`, so the entrypoint compiles to `dist/main.js`. Verified end-to-end against the Docker database.
- [x] **Port hardcoded** — now `process.env.PORT ?? 3001`.
- [x] **Port collision resolved** by moving the *backend* to 3001 and leaving the frontend on Next's default 3000. `CORS_ORIGINS`, `FRONTEND_URL`, `GOOGLE_CALLBACK_URL` and `NEXT_PUBLIC_API_URL` were all realigned; see the table in [CLAUDE.md](CLAUDE.md).
- [x] **`.env.example`** added to both apps, documenting every key with its purpose. The backend `.env`'s duplicate `REDIS_PORT` and `GOOGLE_*` keys were deduped.
- [x] **`yt-dlp` preflight.** `TranscriptionService.onModuleInit` probes for it and warns at boot with install instructions, instead of failing three retries deep in a job.
- [x] **Dockerfiles** for both apps (multi-stage; the backend installs Python and `yt-dlp`, the frontend uses Next's `standalone` output), plus `.dockerignore` files. Compose gained `backend` and `frontend` services behind an **`apps` profile**, so the default `docker compose up -d` still starts only the datastores for local development.
- [x] **Unused dependencies removed.** Backend: `@google/generative-ai`, `youtube-captions-scraper`. Frontend: `ioredis`. `class-transformer` was **kept** — `transform: true` needs it at runtime.
- [x] **Orphan files deleted.** `app.controller.ts`, `app.service.ts`, `src/app/en/page.tsx`.
- [x] Obsolete `version:` key removed from `docker-compose.yml`.

### Verification performed

- `migrate deploy` on an empty database → zero drift from `schema.prisma` (`migrate diff --exit-code` returns 0), app boots, `migrate dev` no longer demands a reset.
- `npm run start:prod` starts against the Docker database and logs `yt-dlp 2026.03.17 detected`.
- Both apps build; the Phase 2 suite still passes 22/22 against the freshly migrated database.
- `docker compose config` validates; the default profile lists only `postgres` and `redis`.

### Not verified

The Docker **images have not been built successfully**. `docker build` was attempted on the backend and stalled pulling `node:22-bookworm-slim` — 7 MB of 50 MB after 500 s (~15 KB/s), so it was abandoned rather than left to run for an hour. The failure is network throughput, not the Dockerfile, but that means **both Dockerfiles remain unproven**: the compose file they plug into validates, and the build inputs (`npm ci`, `npm run build`, Next `standalone` output) all work outside Docker, but no image has actually been produced. Run `docker compose --profile apps build` on a decent connection before relying on them.

---

## Phase 4 — File reorganization ⬜

**Do this last.** Moving files before the behavior fixes buries logic diffs inside renames
and makes history unreviewable.

The backend's real structural flaw is that `JobsModule` is a dumping ground: it provides
`TranscriptionService` and `AIService` directly instead of importing modules that own them.
Give each service a module and the dependency graph becomes explicit.

### Backend

```
src/
  main.ts
  app.module.ts
  common/
    config/          plans.config.ts, env.validation.ts
    filters/         all-exceptions.filter.ts
  infra/
    prisma/          prisma.module.ts  (lowercase), prisma.service.ts
    redis/           redis.module.ts, redis.service.ts
  modules/
    auth/  users/  jobs/  ai/  transcription/  image/  email/  usage/
```

- [ ] Every folder under `modules/` gets its own `*.module.ts` — `ai/`, `transcription/`, and `users/` currently have none.
- [ ] Add `"paths": { "@/*": ["src/*"] }` to `tsconfig.json` so imports stop mixing relative (`../prisma/prisma.service`) with root-absolute (`src/ai/ai.service`) styles.

> `src/guards/` no longer exists — it was removed in Phase 1.

### Frontend

```
src/
  app/          routes only — page.tsx files stay thin
  components/
    ui/         shared primitives
    content/    (unchanged — already well organized)
  features/
    jobs/       useJobs, useJobSSE, JobCard
    auth/       cookie helpers, useAuth
  lib/
    api/        client.ts, endpoints.ts, types.ts
  contexts/
```

- [ ] Change the alias `@/*` from `["./*"]` to `["./src/*"]` so imports read `@/lib/api` instead of `@/src/lib/api`.
- [ ] **Theming refactor (own commit).** `ThemeContext` threads `theme === 'dark' ? … : …` ternaries through nearly every `className` — the dashboard alone has ~20. Toggling a `class="dark"` on `<html>` and using Tailwind's `dark:` variant would delete most of that code.
- [ ] Deduplicate `extractVideoId`, currently copied verbatim into `jobs.processor.ts` and `transcription.service.ts`.

---

## Phase 5 — Tests ⬜

Nothing exists today beyond the untouched NestJS `app.e2e-spec.ts` scaffold. Highest value
first:

- [ ] `UsageService.tryConsume` / `release` — this protects revenue and had a known race. Test the concurrent case explicitly, plus TTL assignment and the fail-closed path when Redis is unavailable.
- [ ] `extractVideoId` — table-test it once deduplicated (Phase 4).
- [ ] `JobsProcessor.process` with mocked services — cover the idempotency guards (already `COMPLETED`, missing row) and the failure path.
- [ ] `AuthService` refresh and password-reset token flows, including that a reset and a Google link both mark the address verified.
- [ ] `JobsService.initiateJob` — quota rollback when enqueue fails.
- [ ] Cookie attributes (`HttpOnly`, `SameSite`, `Secure` under each env combination) and the `api.ts` refresh interceptor's single-flight behaviour under parallel 401s.

---

## Commit sequence

Phase 1 shipped as items 1–4 below.

```
1. fix(jobs): validate input and return proper HTTP status codes
2. fix(frontend): read auth token from cookies in SSE hook
3. fix(usage): make quota check atomic and fail closed
4. fix(prisma): remove duplicate PrismaService provider
5. feat(auth): move JWTs to HttpOnly cookies + short-lived access token
6. feat(auth): add token refresh interceptor
7. chore: rename Prisma.module.ts, drop dead files and deps
8. chore(docker): add Dockerfiles and app services
9. refactor: restructure into common/infra/modules   ← moves only, no logic
10. test: cover usage limiting and job processing
```
