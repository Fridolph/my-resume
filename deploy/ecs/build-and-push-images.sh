#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

TAG=''
IMAGE_PREFIX=''
PLATFORM='linux/amd64'
PUSH='1'
DRY_RUN='0'
BUILDER_NAME='my-resume-builder'
BASE_IMAGE=''
ENGINE_BUILD='0'

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/build-and-push-images.sh \
    --tag v2.1.0 \
    --image-prefix ghcr.io/<user-or-org>/my-resume \
    [--platform linux/amd64] \
    [--engine-build] \
    [--builder-name my-resume-builder] \
    [--base-image docker.1ms.run/library/node:22-slim] \
    [--load]

Options:
  --tag           镜像 tag（必填）
  --image-prefix  镜像前缀（必填，必须全小写），会自动推导：
                  <prefix>/server:<tag>
                  <prefix>/web:<tag>
                  <prefix>/admin:<tag>
  --platform      默认 linux/amd64
  --engine-build  使用 docker build + docker push（绕过 buildx 网络问题）
  --builder-name  可选，buildx builder 名称（如 default）
  --base-image    可选，覆盖 Dockerfile 基础镜像（用于镜像加速）
  --load          本地 load，不 push（调试用）
  --dry-run       只打印命令
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="$2"
      shift 2
      ;;
    --image-prefix)
      IMAGE_PREFIX="${2%/}"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --engine-build)
      ENGINE_BUILD='1'
      shift
      ;;
    --builder-name)
      BUILDER_NAME="$2"
      shift 2
      ;;
    --base-image)
      BASE_IMAGE="$2"
      shift 2
      ;;
    --load)
      PUSH='0'
      shift
      ;;
    --dry-run)
      DRY_RUN='1'
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$TAG" || -z "$IMAGE_PREFIX" ]]; then
  usage
  exit 1
fi

LOWER_IMAGE_PREFIX=$(printf '%s' "$IMAGE_PREFIX" | tr '[:upper:]' '[:lower:]')
if [[ "$IMAGE_PREFIX" != "$LOWER_IMAGE_PREFIX" ]]; then
  echo "image-prefix must be lowercase: $IMAGE_PREFIX" >&2
  echo "Try: --image-prefix $LOWER_IMAGE_PREFIX" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required." >&2
  exit 1
fi

if [[ "$ENGINE_BUILD" != '1' ]]; then
  if ! docker buildx version >/dev/null 2>&1; then
    echo "docker buildx is required (Docker Desktop 4+)." >&2
    exit 1
  fi
fi

run_cmd() {
  if [[ "$DRY_RUN" == '1' ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

if [[ "$ENGINE_BUILD" != '1' ]]; then
  if [[ "$BUILDER_NAME" == 'default' ]]; then
    run_cmd docker buildx use default >/dev/null 2>&1 || true
  else
    run_cmd docker buildx create --use --name "$BUILDER_NAME" >/dev/null 2>&1 || true
    run_cmd docker buildx use "$BUILDER_NAME" >/dev/null 2>&1 || true
  fi
fi

SERVER_REF="${IMAGE_PREFIX}/server:${TAG}"
WEB_REF="${IMAGE_PREFIX}/web:${TAG}"
ADMIN_REF="${IMAGE_PREFIX}/admin:${TAG}"

echo "Building images with:"
echo "  TAG            = $TAG"
echo "  IMAGE_PREFIX   = $IMAGE_PREFIX"
echo "  PLATFORM       = $PLATFORM"
if [[ "$ENGINE_BUILD" == '1' ]]; then
  echo "  BUILD_MODE     = engine"
else
  echo "  BUILDER_NAME   = $BUILDER_NAME"
fi
echo "  SERVER_IMAGE   = $SERVER_REF"
echo "  WEB_IMAGE      = $WEB_REF"
echo "  ADMIN_IMAGE    = $ADMIN_REF"
if [[ -n "$BASE_IMAGE" ]]; then
  echo "  BASE_IMAGE     = $BASE_IMAGE"
fi

if [[ "$PUSH" == '1' ]]; then
  PUBLISH_ARGS=(--push)
else
  PUBLISH_ARGS=(--load)
fi

cd "$REPO_ROOT"
if [[ -n "$BASE_IMAGE" ]]; then
  log_msg="Prefetch base image: $BASE_IMAGE"
  echo "$log_msg"
  run_cmd docker pull "$BASE_IMAGE"
else
  true
fi

if [[ "$ENGINE_BUILD" == '1' ]]; then
  if [[ -n "$BASE_IMAGE" ]]; then
    run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" .
    run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" .
    run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" .
  else
    run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" .
    run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" .
    run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" .
  fi

  if [[ "$PUSH" == '1' ]]; then
    run_cmd docker push "$SERVER_REF"
    run_cmd docker push "$WEB_REF"
    run_cmd docker push "$ADMIN_REF"
  fi
else
  if [[ -n "$BASE_IMAGE" ]]; then
    run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${PUBLISH_ARGS[@]}" .
    run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${PUBLISH_ARGS[@]}" .
    run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${PUBLISH_ARGS[@]}" .
  else
    run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" "${PUBLISH_ARGS[@]}" .
    run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" "${PUBLISH_ARGS[@]}" .
    run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" "${PUBLISH_ARGS[@]}" .
  fi
fi

echo "Done."
if [[ "$PUSH" == '1' ]]; then
  echo "Pushed:"
  echo "  $SERVER_REF"
  echo "  $WEB_REF"
  echo "  $ADMIN_REF"
else
  echo "Loaded locally:"
  echo "  $SERVER_REF"
  echo "  $WEB_REF"
  echo "  $ADMIN_REF"
fi
