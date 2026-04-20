ARG BASE_IMAGE=node:22-slim
FROM ${BASE_IMAGE}

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5577
ARG NEXT_PUBLIC_APP_VERSION=0.0.0

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter "./packages/*" --if-present build
RUN pnpm --filter @my-resume/admin build

ENV NODE_ENV=production
ENV PORT=5566

EXPOSE 5566

CMD ["pnpm", "--filter", "@my-resume/admin", "start"]
