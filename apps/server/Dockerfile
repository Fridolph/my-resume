ARG BASE_IMAGE=node:22-slim
FROM ${BASE_IMAGE}

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter "./packages/*" --if-present build
RUN pnpm --filter @my-resume/server build

ENV NODE_ENV=production
ENV PORT=5577

EXPOSE 5577

CMD ["pnpm", "--filter", "@my-resume/server", "start:prod"]
