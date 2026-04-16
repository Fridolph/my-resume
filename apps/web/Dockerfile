FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS builder

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5577
ARG RESUME_API_BASE_URL=http://localhost:5577

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV RESUME_API_BASE_URL=$RESUME_API_BASE_URL

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @my-resume/web build

FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5555
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 5555

CMD ["node", "apps/web/server.js"]
