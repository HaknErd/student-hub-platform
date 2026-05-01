FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

COPY . .

ENV DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --frozen-lockfile --prod --ignore-scripts

RUN mkdir -p /app/data/avatars /app/data/banners /app/data/resource-files \
    && chown -R app:app /app

USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV STORAGE_DIR=/app/data

EXPOSE 3000

CMD ["node", "build"]
