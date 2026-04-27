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

FROM base AS runtime-base
ARG APT_DEBIAN_MIRROR_URL=
ARG APT_SECURITY_MIRROR_URL=
RUN set -eux; \
  APT_OPTIONS='-o Acquire::Retries=6 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30'; \
  ORIGINAL_DEBIAN_SOURCES=''; \
  ORIGINAL_SOURCES_LIST=''; \
  DEBIAN_MIRROR="${APT_DEBIAN_MIRROR_URL%/}"; \
  SECURITY_MIRROR="${APT_SECURITY_MIRROR_URL%/}"; \
  if [ -n "$DEBIAN_MIRROR" ] && [ -z "$SECURITY_MIRROR" ]; then \
    case "$DEBIAN_MIRROR" in \
      */debian) SECURITY_MIRROR="${DEBIAN_MIRROR%/debian}/debian-security" ;; \
      *) SECURITY_MIRROR="$DEBIAN_MIRROR" ;; \
    esac; \
  fi; \
  if [ -n "$DEBIAN_MIRROR" ]; then \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      ORIGINAL_DEBIAN_SOURCES="$(cat /etc/apt/sources.list.d/debian.sources)"; \
      sed -i -E "s|https?://deb.debian.org/debian|$DEBIAN_MIRROR|g; s|https?://deb.debian.org/debian-security|$SECURITY_MIRROR|g; s|https?://security.debian.org/debian-security|$SECURITY_MIRROR|g" /etc/apt/sources.list.d/debian.sources; \
    elif [ -f /etc/apt/sources.list ]; then \
      ORIGINAL_SOURCES_LIST="$(cat /etc/apt/sources.list)"; \
      sed -i -E "s|https?://deb.debian.org/debian|$DEBIAN_MIRROR|g; s|https?://deb.debian.org/debian-security|$SECURITY_MIRROR|g; s|https?://security.debian.org/debian-security|$SECURITY_MIRROR|g" /etc/apt/sources.list; \
    fi; \
    echo "Using custom apt mirror: $DEBIAN_MIRROR"; \
  fi; \
  if ! apt-get update $APT_OPTIONS; then \
    echo "Custom apt update failed, fallback to default Debian sources"; \
    if [ -n "$ORIGINAL_DEBIAN_SOURCES" ]; then \
      printf '%s\n' "$ORIGINAL_DEBIAN_SOURCES" >/etc/apt/sources.list.d/debian.sources; \
    fi; \
    if [ -n "$ORIGINAL_SOURCES_LIST" ]; then \
      printf '%s\n' "$ORIGINAL_SOURCES_LIST" >/etc/apt/sources.list; \
    fi; \
    apt-get update $APT_OPTIONS; \
  fi; \
  FONT_PACKAGE=''; \
  for candidate in fonts-wqy-zenhei fonts-arphic-uming fonts-arphic-ukai fonts-noto-cjk; do \
    if apt-cache show "$candidate" >/dev/null 2>&1; then \
      FONT_PACKAGE="$candidate"; \
      break; \
    fi; \
  done; \
  if [ -z "$FONT_PACKAGE" ]; then \
    echo "No available CJK font package found in current apt sources"; \
    exit 1; \
  fi; \
  echo "Selected CJK font package: $FONT_PACKAGE"; \
  for attempt in 1 2 3; do \
    if apt-get install -y --no-install-recommends --fix-missing "$FONT_PACKAGE"; then \
      break; \
    fi; \
    if [ "$attempt" -eq 3 ]; then \
      echo "Failed to install CJK font package after retries: $FONT_PACKAGE"; \
      exit 1; \
    fi; \
    sleep 2; \
    apt-get update $APT_OPTIONS; \
  done; \
  rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
RUN pnpm install --frozen-lockfile --filter @my-resume/server...

FROM deps AS builder
COPY . .
RUN pnpm --filter @my-resume/server build
RUN pnpm --filter @my-resume/server deploy --legacy --prod /prod/server

FROM runtime-base AS runner
ENV NODE_ENV=production
ENV PORT=5577

COPY pnpm-workspace.yaml ./
COPY --from=builder /prod/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/data ./apps/server/data
COPY --from=builder /app/apps/server/storage ./apps/server/storage

EXPOSE 5577

CMD ["node", "apps/server/dist/src/main.js"]
