ARG BASE_IMAGE=node:22-slim

FROM ${BASE_IMAGE} AS base
ARG NPM_REGISTRY_URL=https://registry.npmmirror.com
ARG PNPM_VERSION=10.8.0
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV npm_config_registry=$NPM_REGISTRY_URL
ENV NPM_CONFIG_REGISTRY=$NPM_REGISTRY_URL
ENV PNPM_CONFIG_REGISTRY=$NPM_REGISTRY_URL
RUN npm install -g "pnpm@$PNPM_VERSION" --registry="$NPM_REGISTRY_URL"
WORKDIR /app

# ═══ 阶段 1：依赖安装（仅当前 app + 共享包） ═══
FROM base AS deps
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile --filter @my-resume/admin...

# ═══ 阶段 2：构建共享包（业务代码改动时此层缓存命中） ═══
FROM deps AS shared
COPY packages/ packages/
RUN pnpm --filter "./packages/*" build

# ═══ 阶段 3：构建应用 ═══
FROM shared AS builder
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5577
ARG NEXT_PUBLIC_APP_VERSION=0.0.0

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

COPY apps/admin/ apps/admin/
RUN pnpm --filter @my-resume/admin build

# ═══ 阶段 4：最小运行时 ═══
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5566
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

EXPOSE 5566

CMD ["node", "apps/admin/server.js"]
