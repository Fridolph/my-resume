ARG BASE_IMAGE=node:22-slim
FROM ${BASE_IMAGE}
ARG APT_DEBIAN_MIRROR_URL=
ARG APT_SECURITY_MIRROR_URL=

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

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

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter "./packages/*" --if-present build
RUN pnpm --filter @my-resume/server build

ENV NODE_ENV=production
ENV PORT=5577

EXPOSE 5577

CMD ["pnpm", "--filter", "@my-resume/server", "start:prod"]
