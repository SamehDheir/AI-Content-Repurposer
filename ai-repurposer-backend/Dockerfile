# ── Build ─────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npx prisma generate && npm run build

# ── Runtime ───────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

# yt-dlp is required for the Whisper transcription fallback. It is a Python
# program, so the interpreter has to be present too.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 ca-certificates curl \
    && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated Prisma client lives in node_modules and is platform-specific,
# so it is copied from the build stage rather than regenerated.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./

USER node
EXPOSE 3001

CMD ["node", "dist/main"]
