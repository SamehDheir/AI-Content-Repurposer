# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Known defects and the planned remediation order live in [ROADMAP.md](ROADMAP.md). Phases 1–4 are done; Phase 5 (tests) is the remaining work.

## Repository layout

Two independent npm projects in one git repo — there is no workspace/monorepo tooling, so `npm install` and all scripts are run from inside each app directory:

- `ai-repurposer-backend/` — NestJS 11 API on port **3001** (`process.env.PORT ?? 3001`)
- `ai-repurposer-frontend/` — Next.js 16 App Router + React 19 + Tailwind 4 on port **3000** (Next's default)

Source layout (Phase 4). Every feature folder owns a `*.module.ts`; nothing is
provided by a module that does not own it:

```
backend  src/{main,app.module}.ts
         src/common/     config/ (plans.config.ts), utils/ (youtube.util.ts)
         src/infra/      prisma/, redis/
         src/modules/    auth/ users/ jobs/ ai/ transcription/ image/ email/ usage/

frontend src/app/        routes only
         src/components/ ui/ (shared primitives), content/ (per ContentType)
         src/features/   jobs/ (useJobs, useJobSSE, JobCard)
         src/lib/api/    client.ts, endpoints.ts, types.ts, index.ts
         src/contexts/   ThemeContext.tsx
         src/proxy.ts    must stay here — Next resolves the proxy by convention
```

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

Transcription fallback shells out to **`yt-dlp`**, which must be on `PATH`. Without it, only videos that already have YouTube captions will process — `TranscriptionService.onModuleInit` logs a warning at boot if it is missing. The backend Docker image installs it along with Python.

YouTube extraction now needs a JavaScript runtime, so the command passes `--js-runtimes node`. **The runtime is `node`, not `nodejs`** — yt-dlp does not reject an unknown name, it warns, silently drops the runtime, and then fails every video with `ERROR: [youtube] <id>: This video is not available`, which looks like a dead or private video rather than a local misconfiguration. If transcription starts failing wholesale, check for `Ignoring unsupported JavaScript runtime(s)` in the log first, and confirm by hand:

```bash
yt-dlp --js-runtimes node --simulate --print "%(id)s|%(duration)s" "<url>"
```

The download requests `bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio` but always writes to a `.webm` filename, and there is no ffmpeg to remux. Where a video offers no webm audio, that leaves m4a bytes in a `.webm` file, which Groq may reject on the filename — a known rough edge, not yet hit in practice.

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

1. `POST /jobs` ([jobs.controller.ts](ai-repurposer-backend/src/modules/jobs/jobs.controller.ts)) → `JobsService.initiateJob` atomically claims a monthly quota slot, creates a `Job` row (`QUEUED`), and enqueues `process-video` on the BullMQ `repurpose-queue` (3 attempts, exponential backoff). If anything after the claim fails, the slot is released and the orphaned row deleted.
2. `JobsProcessor` ([jobs.processor.ts](ai-repurposer-backend/src/modules/jobs/jobs.processor.ts)) — the single worker — runs: transcript (up to 3 attempts) → all four `ContentType`s generated **in parallel** via `Promise.all` → one Prisma `$transaction` that deletes prior content, inserts the new rows, and flips the job to `COMPLETED`. It is idempotent: it skips jobs already `COMPLETED` or missing from the DB.
3. The frontend watches progress over **SSE**: `GET /jobs/:id/status` (authenticated by the same cookie guard as every other route) polls the DB every 2s via `rxjs interval` and completes on `COMPLETED`/`FAILED`.

Because the worker runs in the same Nest process as the API, there is no separate worker entrypoint — starting the backend starts both.

### External services

- **Transcription** ([transcription.service.ts](ai-repurposer-backend/src/modules/transcription/transcription.service.ts)): tries YouTube captions via `youtubei.js` first; falls back to downloading audio with `yt-dlp` into the OS temp dir and sending it to **Groq Whisper** (`whisper-large-v3-turbo`, 24 MB cap). The temp file is deliberately kept between retry attempts and cleaned up by the processor via `cleanupAudioFile`.
- **Text generation** ([ai.service.ts](ai-repurposer-backend/src/modules/ai/ai.service.ts)): OpenAI SDK pointed at **OpenRouter**, model from `OPENROUTER_MODEL` (default `meta-llama/llama-3.1-8b-instruct`). Per-content-type prompts live in the `PROMPTS` map; the system prompt carries the language, the dialect and a block of anti-"this was written by AI" rules.

  **The model is the ceiling on Arabic quality, not the prompt.** The default 8B obeys every constraint — measured across EG/MA/MSA it emitted no emoji, no em dashes and no hashtags — and still writes Arabic that is often ungrammatical, with Darija close to word salad. That is capacity, not prompting.

  Measured on the same Egyptian thread (2026-07-26), all three clean of emoji/em dashes/hashtags:

  | Model | In/Out per M | Egyptian Arabic |
  |---|---|---|
  | `meta-llama/llama-3.1-8b-instruct` (default) | $0.05 / $0.08 | Incoherent, and invents facts — reported the $3,800 figure as جنيه |
  | `meta-llama/llama-3.3-70b-instruct` | $0.13 / $0.40 | Fluent but **mixes scripts mid-word**: `أtellك`, `تحtajَه`, and katakana in `الرーチ`. Disqualifying |
  | `qwen/qwen-2.5-72b-instruct` | $0.36 / $0.40 | Fluent, idiomatic, every figure faithful to the transcript. **Recommended** |

  Qwen works out around a cent per job across all four formats. The default is left on the 8B because switching is a billing decision — note that this account currently has little OpenRouter credit, and `google/gemini-2.5-flash` failed the same test with a 402.

  Output is passed through `stripAiTells` ([sanitize.ts](ai-repurposer-backend/src/modules/ai/sanitize.ts)) on the way out, which removes emoji, keycaps, flags, ZWJ sequences and dingbats, converts spaced em dashes to commas, and strips chat preambles and code fences. It is covered by `sanitize.spec.ts`. Note that its regexes use alternation rather than character classes for the invisible joiners — `no-misleading-character-class` rejects them inside a class.
- **Dialects** ([dialects.config.ts](ai-repurposer-backend/src/common/config/dialects.config.ts)): a job can name a target country, and the prompt switches to that country's spoken Arabic. Each profile carries marker vocabulary (question words, "want", "now", the negator) because a small model drifts back to MSA within a paragraph without concrete words to reach for. `Job.country` is null for Modern Standard, which is every job predating the column. The browser gets a **display-only** subset from [dialects.ts](ai-repurposer-frontend/src/lib/dialects.ts) — marker vocabulary is prompt-engineering and stays server-side. The backend is the authority on valid codes, so drift between the two lists surfaces as a 400, not as the wrong dialect.
- **Images** ([image.service.ts](ai-repurposer-backend/src/modules/image/image.service.ts)): OpenRouter writes a Flux-style prompt, which is embedded in a **pollinations.ai** URL and then shortened through TinyURL. No image bytes are stored — only the URL on `Job.imageUrl`.

  Two things here were silently broken until they were fixed, and both are easy to reintroduce. The prompt-writing call used `meta-llama/llama-3.3-8b-instruct:free`, which **does not exist** — there is no 8B in the 3.3 line — so every call 404'd and `fallbackPrompt` produced every image prompt the app ever used. And the style guide asked for `bold typography`, `magazine cover` and `infographic`, which are exactly the genres that make the model render mangled pseudo-text, the most obvious tell in a generated image. Every style is now a text-free photographic genre, `NO_TEXT` is appended to every prompt, and `enhance` is **off** — it is pollinations' own LLM rewrite, which undoes the prompt and likes to add the lettering `NO_TEXT` rules out.

  **Measured against the live endpoint (2026-07-26), so do not go looking for quality in these knobs:**
  - `model` is a **no-op**. `/models` offers only `sana`; `model=flux` and `model=sana` return a byte-identical image for the same seed. The parameter is kept only so the request is right if more models return.
  - Resolution is **capped at 1024x576** for 16:9. Requesting 1280x720 and 1920x1080 both come back 1024x576. `width`/`height` choose the aspect ratio and nothing else.

  So image quality is entirely a function of the prompt, which is why the prompt path is built the way it is. `condense` samples the title plus paragraphs from across the whole piece — it used to be `content.slice(0, 1500)`, the opening, which is the hook and says least about the subject. The model must answer `SUBJECT:` before `SCENE:`, which is logged and is the first thing to check when an image looks unrelated. `NO_ANATOMY` bans visible hands and faces because that is this model's most visible failure — a scene described only as "person typing at a desk" came back with a hand rendered as a blob of fingers. And `fallbackPrompt` takes **no words from the content**: it used to splice sentences into the prompt, so an Arabic post put Arabic script into the image prompt and the model rendered Arabic-looking gibberish across the picture.

### Auth

JWT via Passport with four strategies (`local`, `jwt`, `jwt-refresh`, `google`). Access tokens live **15 minutes**, refresh tokens **7 days**, under different secrets (`JWT_SECRET` / `JWT_REFRESH_SECRET`); the refresh token is stored bcrypt-hashed on `User.refreshToken`.

**Tokens are HttpOnly cookies and are never visible to JavaScript.** They are set server-side by [cookies.ts](ai-repurposer-backend/src/modules/auth/cookies.ts) on login, refresh and the Google callback, and cleared on logout. Consequences worth internalising before touching this code:

- **No response body ever contains a token**, and no client code may set one. `document.cookie` must not reappear anywhere in the frontend.
- **The bearer header is not accepted.** `JwtStrategy` reads the `accessToken` cookie only, so `curl` needs a cookie jar (`-c`/`-b`), not `Authorization`.
- Every frontend request sends `credentials: 'include'` ([api.ts](ai-repurposer-frontend/src/lib/api/client.ts)). Because credentialed CORS forbids a wildcard origin, `CORS_ORIGINS` must list the frontend origin exactly.
- `client.ts` retries once through `POST /auth/refresh` on a 401, sharing a single in-flight refresh so a burst of parallel 401s rotates the token once. `/auth/login`, `/auth/register` and `/auth/refresh` are excluded to avoid a loop.
- [proxy.ts](ai-repurposer-frontend/src/proxy.ts) gates `/dashboard` and `/login` on the **refresh** cookie, not the access cookie — the latter expires every 15 minutes and would bounce active users to the login page.
- Cookie attributes come from env: `COOKIE_SAMESITE` (default `lax`), `COOKIE_SECURE` (default: on in production), `COOKIE_DOMAIN`. A cross-domain deployment needs `COOKIE_SAMESITE=none`, which forces `Secure`, requires HTTPS, and gives up the CSRF protection `Lax` provides for free — that setup would need CSRF tokens.

**Email verification is enforced at login.** `validateUser` rejects unverified accounts with 403, so `register` deliberately returns a message rather than a session. Verification tokens expire after 24h, and `POST /auth/resend-verification` exists so an expired token is not a dead end. Google accounts are pre-verified. Accounts predating enforcement were backfilled to verified by `20260723120000_email_verification_expiry_and_grandfather`.

### Usage limiting

Two independent mechanisms, easy to confuse:

- **Plan quota** — Redis key `usage:{userId}:{YYYY-MM}` (see [plans.config.ts](ai-repurposer-backend/src/common/config/plans.config.ts)), expiring at the start of next month UTC. `FREE` = 1 job/month, `PRO` = `Infinity`. Claimed by `UsageService.tryConsume` from inside `JobsService`, reported by `GET /users/me`. The `User.jobsUsedThisMonth`/`usagePeriodStart` columns exist in the schema but are **not used** — Redis is the source of truth, so quota resets if Redis is flushed.

  Enforcement deliberately lives in the service, **not** a guard: Nest runs guards before pipes, so a guard would burn a user's monthly slot on requests that the `ValidationPipe` is about to reject. `tryConsume` runs INCR, the TTL and the limit check in one Lua script so concurrent requests cannot both observe the pre-increment value, and it lets Redis errors propagate so the endpoint fails closed.
- **Rate limiting** — `@nestjs/throttler`, global 10/min + 100/hr, with tighter `@Throttle` overrides on register (3/min), login (5/min), job creation (5/min), and image generation (5–10/min).

## Conventions and gotchas

- Both apps use a `@/*` alias. Backend: `@/*` → `src/*` (`@/infra/prisma/prisma.service`). Frontend: `@/*` → `./src/*` (`@/lib/api`). Neither app has bare relative imports across folder boundaries any more — only within a module (`./jobs.service`, `../cookies` from `strategies/`).
  - The backend alias needs no runtime resolver: `nest build` rewrites aliased imports to relative `require`s in `dist/`. Jest does **not** read `paths`, so both jest configs carry a `moduleNameMapper`.
- Backend filenames are all lowercase. `Prisma.module.ts` was renamed to `prisma.module.ts` because the mixed-casing imports only worked on Windows and broke on a case-sensitive filesystem — keep new files lowercase.
  - That rename was made on disk in Phase 3 but **did not reach git until Phase 4**: `core.ignorecase=true` on Windows meant git kept tracking `Prisma.module.ts`, so a checkout on Linux still produced the capitalised name and the build broke. If you rename only the case of a file, verify with `git ls-tree -r --name-only HEAD | grep -i <name>` — `git status` will look clean either way.
- `main.ts` registers a global `ValidationPipe({ whitelist: true, transform: true })`, so every `@Body()` needs a DTO class to be validated — an inline object type silently skips validation entirely. DTOs live in `src/modules/jobs/dto/` and `src/modules/auth/dto/`. Note that `whitelist` strips undecorated properties, so a field without a decorator never reaches the handler.
- Dark/light theming is **token-driven** — see the design system below. Phase 4 replaced the old `useTheme()` ternaries with Tailwind's `dark:` variant; the redesign then replaced the colours themselves with semantic tokens (`bg-paper`, `text-ink-2`, `border-rule`), which is what you should reach for now. `@custom-variant dark (&:where(.dark, .dark *))` is still in `globals.css` and still required: without it Tailwind 4 keys `dark:` to the OS `prefers-color-scheme` and ignores the in-app toggle.
  - Reach for `useTheme()` only when the branch is not CSS at all. The theme toggle's own icons switch via `.only-dark` / `.only-light` instead, so they are correct on the first paint rather than after hydration.
  - Tailwind scans source for **complete** class names, so never build one by concatenation — `border-b-${dark ? '[#141416]' : 'white'}` generates nothing. This bug shipped in `ContentViewer` until Phase 4.
- Dashboard components (`JobCard`, `ContentViewer`, `UsageBanner`) are `React.lazy` + `Suspense` loaded; keep new heavy components on that path.

### The design system ("Cutting Room")

The marketing page, the dashboard and the auth pages share one system defined in [globals.css](ai-repurposer-frontend/src/app/globals.css). Read it before styling anything new.

- **Theming is token-driven, not ternary-driven.** `.dark` / `.light` on `<html>` swap CSS variables, and `@theme inline` turns them into ordinary utilities: `bg-paper`, `bg-surface`, `text-ink` / `text-ink-2` / `text-ink-3`, `border-rule` / `border-rule-strong`, `text-signal`, `bg-signal-wash`, `bg-scrim`. Use those. Do **not** reintroduce `theme === 'dark' ? … : …` per-`className` ternaries — no page uses them any more. `useTheme()` remains for behaviour (the toggle); the toggle's own icons swap via `.only-dark` / `.only-light` so they are right on first paint.
- **The auth pages share one kit** in [src/components/auth/](ai-repurposer-frontend/src/components/auth/). `AuthShell` is the docket chrome (header, plate, footer) used by `forgot-password`, `reset-password`, `verify-email` and `auth/callback`; it exports `Stamp` (the rubber-stamp terminal state, in place of a tick in a circle), `Problem` (the signal error strip) and `Action` (the primary button). `Field` is the mono-labelled rule input, shared with `/login`. Reuse these rather than restyling a form inline — `/login` keeps its own two-column layout because it is the front door, but draws its fields from the same `Field`.
- **`--signal-on-ink` exists for inverted bands.** On `bg-ink` the background is the *other* theme's paper, so a normal `text-signal` goes muddy. The homepage ticker and the login side panel use it.
- **Four riso inks, one per output format** — `--fmt-thread`, `--fmt-blog`, `--fmt-social`, `--fmt-marks`. They appear as hairlines, dots and small rules only, never as gradients, and the same colour tracks a format from the homepage specimen to the ledger row to the viewer's index tab.
- **Type**: `.display` (Newsreader, the editorial serif — add `.display-xl` for settings above ~2.5rem), `.label` (11px mono caps, 0.13em, the metadata slug that opens most blocks), `.slug` (mono, tabular, for URLs, ids and timecodes). Newsreader replaced Instrument Serif because a high-contrast display face went faint at small sizes and on the dark theme.
  - **`.label` is for two-to-four word slugs, never a sentence.** Caps plus 0.13em tracking stops being readable the moment it carries prose; full sentences use ordinary sentence-case body text (`text-[12.5px] leading-[1.6] text-ink-3`).
- **Generated content is bidirectional.** Arabic is the *default* output language, so `ContentViewer` sets `dir`/`lang` on the sheet from `job.language` — mirroring it, not just realigning it, so the numbering columns and rules move to the correct side. Individual pieces additionally carry `dir="auto"` so one English post inside an Arabic thread still resolves. Use logical properties (`me-*`, `float-start`, `end-0`) inside the sheet, never `mr-*`/`float-left`. The blog drop cap is Latin-only on purpose: Arabic is cursive, and lifting the first letter out of a word strips its joining form.
- **Social images** are generated by [opengraph-image.tsx](ai-repurposer-frontend/src/app/opengraph-image.tsx) (re-exported by `twitter-image.tsx` — Twitter does not fall back to the OG file). It renders with no stylesheet, so the tokens are inlined there and must be updated by hand if the palette moves. `metadataBase` in `layout.tsx` reads **`NEXT_PUBLIC_SITE_URL`**; without it social URLs resolve against `http://localhost:3000` and every shared link points at nothing.
- **Motion** lives in `cr-*` keyframes in globals.css and is applied via inline `style={{ animation: … }}` or the `.anim-*` helpers. Scroll reveals go through `<Reveal>` / `useReveal`, which shares one IntersectionObserver across the page. Everything is disabled under `prefers-reduced-motion`.
- Corners are square (or ≤2px), depth is a hard offset shadow (`.plate`, or `shadow-[4px_4px_0_var(--rule-strong)]`) rather than a blur, and `.hatch` / `.gridlines` / `.regmark` supply the print furniture.
- `layout.tsx` runs a pre-paint inline script that sets the theme class before React hydrates; without it the whole page flashes in the wrong theme.
- Both `.env` (backend) and `.env.local` (frontend) are committed-adjacent local files. Backend expects: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, and `SMTP_*` for nodemailer. Optional: `OPENROUTER_MODEL` overrides the writing model.
- Adding a `ContentType` requires changes in four places: the Prisma enum, `CONTENT_TYPES` in the processor, `PROMPTS` in `ai.service.ts`, and the frontend `TABS`/content components.
- Adding a country to the dialect picker requires two: `DIALECTS` in `dialects.config.ts` (backend, with markers and register) and `DIALECT_GROUPS` in `lib/dialects.ts` (frontend, display only).
- `extractVideoId` lives in `src/common/utils/youtube.util.ts`. `JobsProcessor` and `TranscriptionService` both call it — do not re-inline a copy, which is how it drifted before.
