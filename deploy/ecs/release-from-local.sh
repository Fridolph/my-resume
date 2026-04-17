#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TAG=''
VERSION=''
REMOTE_HOST=''
REMOTE_PORT='22'
REMOTE_USER='root'
REMOTE_DEPLOY_ROOT=''
REMOTE_STACK_ENV_FILE=''
PUBLIC_API_BASE_URL=''
WEB_SERVER_API_BASE_URL='http://server:5577'
PLATFORM='linux/amd64'
ENGINE_BUILD='0'
BUILDER_NAME=''
BASE_IMAGE=''
SKIP_BUILD='0'
SKIP_DEPLOY='0'
SKIP_PUBLIC_CHECK='0'
AUTO_CREATE_TAG='1'
AUTO_PUSH_TAG='1'

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/release-from-local.sh \
    --tag v2.2.4 \
    --ecs-host <ecs-ip-or-domain> \
    [--ecs-user root] \
    [--ecs-port 22] \
    [--stack-env ./.env.stack.local]

  # 或使用版本号（自动转 tag）
  ./deploy/ecs/release-from-local.sh \
    --version 2.2.4 \
    --ecs-host <ecs-ip-or-domain>

Options:
  --tag                    发布 tag（如 v2.2.4）
  --version                发布版本号（如 2.2.4，会自动转为 v2.2.4）
  --stack-env              本地 stack env 文件路径（默认优先 .env.stack.local）
  --ecs-host               ECS 主机（必填，除非 --skip-deploy）
  --ecs-user               ECS SSH 用户，默认 root
  --ecs-port               ECS SSH 端口，默认 22
  --remote-deploy-root     ECS 仓库目录，默认读取 stack env 中 DEPLOY_ROOT
  --remote-stack-env       ECS 端 stack env 文件路径（可选）
  --public-api-base-url    注入 web/admin 的 NEXT_PUBLIC_API_BASE_URL
  --web-server-api-base-url
                           注入 web 的 RESUME_API_BASE_URL，默认 http://server:5577
  --platform               镜像平台，默认 linux/amd64
  --engine-build           使用 docker engine 构建并推送（跳过 buildx）
  --builder-name           buildx builder 名称
  --base-image             Dockerfile 基础镜像覆盖
  --skip-build             跳过本地构建推送，仅执行远程发布
  --skip-deploy            跳过远程发布，仅执行本地构建推送
  --skip-public-check      跳过公网域名验收（仅对 deploy 生效）
  --no-auto-create-tag     tag 不存在时不自动创建
  --no-auto-push-tag       tag 未推到远端时不自动 push
  --dry-run                仅打印命令
EOF
}

normalize_tag() {
  local value="$1"
  if [[ "$value" == v* ]]; then
    printf '%s\n' "$value"
    return 0
  fi
  printf 'v%s\n' "$value"
}

git_tag_exists_local() {
  local candidate="$1"
  git rev-parse --verify "${candidate}^{tag}" >/dev/null 2>&1 || \
    git rev-parse --verify "$candidate" >/dev/null 2>&1
}

git_tag_exists_remote() {
  local candidate="$1"
  git ls-remote --tags origin "refs/tags/${candidate}" "refs/tags/${candidate}^{}" | \
    grep -q "refs/tags/${candidate}"
}

ensure_release_tag_ready() {
  local candidate="$1"

  run_cmd git -C "$REPO_ROOT" fetch origin --tags --force

  if ! git_tag_exists_local "$candidate"; then
    [[ "$AUTO_CREATE_TAG" == '1' ]] || die "Tag not found locally: $candidate"

    if [[ "$DRY_RUN" == '1' ]]; then
      log "[dry-run] git -C $REPO_ROOT tag -a $candidate -m 'release: $candidate'"
    else
      if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
        die "Working tree is not clean; refuse to create release tag: $candidate"
      fi
      run_cmd git -C "$REPO_ROOT" tag -a "$candidate" -m "release: $candidate"
      log "Created local tag: $candidate"
    fi
  fi

  if ! git_tag_exists_remote "$candidate"; then
    [[ "$AUTO_PUSH_TAG" == '1' ]] || die "Tag not found on origin: $candidate"
    run_cmd git -C "$REPO_ROOT" push origin "$candidate"
    log "Pushed tag to origin: $candidate"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="$2"
      shift 2
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --ecs-host)
      REMOTE_HOST="$2"
      shift 2
      ;;
    --ecs-user)
      REMOTE_USER="$2"
      shift 2
      ;;
    --ecs-port)
      REMOTE_PORT="$2"
      shift 2
      ;;
    --remote-deploy-root)
      REMOTE_DEPLOY_ROOT="$2"
      shift 2
      ;;
    --remote-stack-env)
      REMOTE_STACK_ENV_FILE="$2"
      shift 2
      ;;
    --public-api-base-url)
      PUBLIC_API_BASE_URL="$2"
      shift 2
      ;;
    --web-server-api-base-url)
      WEB_SERVER_API_BASE_URL="$2"
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
    --skip-build)
      SKIP_BUILD='1'
      shift
      ;;
    --skip-deploy)
      SKIP_DEPLOY='1'
      shift
      ;;
    --skip-public-check)
      SKIP_PUBLIC_CHECK='1'
      shift
      ;;
    --no-auto-create-tag)
      AUTO_CREATE_TAG='0'
      shift
      ;;
    --no-auto-push-tag)
      AUTO_PUSH_TAG='0'
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
      die "Unknown argument: $1"
      ;;
  esac
done

if [[ -z "${STACK_ENV_FILE:-}" && -f "$REPO_ROOT/.env.stack.local" ]]; then
  STACK_ENV_FILE="$REPO_ROOT/.env.stack.local"
fi

if [[ -n "$VERSION" ]]; then
  VERSION_TAG=$(normalize_tag "$VERSION")
  if [[ -z "$TAG" ]]; then
    TAG="$VERSION_TAG"
  fi
fi

load_stack_env
require_commands git
resolve_deploy_mode

if [[ "$DEPLOY_MODE" != 'image' ]]; then
  die "release-from-local.sh only supports DEPLOY_MODE=image"
fi

if [[ -z "$REMOTE_DEPLOY_ROOT" ]]; then
  REMOTE_DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/my-resume}"
fi

if [[ -z "$TAG" && -n "${IMAGE_TAG:-}" ]]; then
  TAG=$(normalize_tag "$IMAGE_TAG")
fi

if [[ -z "$TAG" ]]; then
  die "Missing release identifier. Use --tag or --version, or provide IMAGE_TAG in stack env."
fi

TAG=$(normalize_tag "$TAG")

if [[ -n "$VERSION" ]]; then
  VERSION_TAG=$(normalize_tag "$VERSION")
  if [[ "$TAG" != "$VERSION_TAG" ]]; then
    die "--tag and --version mismatch: $TAG vs $VERSION_TAG"
  fi
fi

if [[ -z "$PUBLIC_API_BASE_URL" ]]; then
  require_vars API_DOMAIN
  PUBLIC_API_BASE_URL="https://${API_DOMAIN}"
fi

IMAGE_ARGS=()
if [[ -n "${IMAGE_REPOSITORY_PREFIX:-}" ]]; then
  IMAGE_ARGS+=(--image-prefix "${IMAGE_REPOSITORY_PREFIX}")
elif [[ -n "${SERVER_IMAGE:-}" && -n "${WEB_IMAGE:-}" && -n "${ADMIN_IMAGE:-}" ]]; then
  IMAGE_ARGS+=(--server-image "${SERVER_IMAGE}" --web-image "${WEB_IMAGE}" --admin-image "${ADMIN_IMAGE}")
else
  die "Image repository is missing. Provide IMAGE_REPOSITORY_PREFIX or SERVER_IMAGE/WEB_IMAGE/ADMIN_IMAGE in stack env."
fi

log "Release tag resolved: $TAG"
log "Public API base resolved: $PUBLIC_API_BASE_URL"
log "Remote deploy root: $REMOTE_DEPLOY_ROOT"

ensure_release_tag_ready "$TAG"

if [[ "$SKIP_BUILD" != '1' ]]; then
  if [[ "$DRY_RUN" != '1' ]]; then
    require_commands docker
  fi

  BUILD_CMD=(
    "$SCRIPT_DIR/build-and-push-images.sh"
    --tag "$TAG"
    --platform "$PLATFORM"
    --public-api-base-url "$PUBLIC_API_BASE_URL"
    --web-server-api-base-url "$WEB_SERVER_API_BASE_URL"
  )
  BUILD_CMD+=("${IMAGE_ARGS[@]}")

  if [[ "$ENGINE_BUILD" == '1' ]]; then
    BUILD_CMD+=(--engine-build)
  fi
  if [[ -n "$BUILDER_NAME" ]]; then
    BUILD_CMD+=(--builder-name "$BUILDER_NAME")
  fi
  if [[ -n "$BASE_IMAGE" ]]; then
    BUILD_CMD+=(--base-image "$BASE_IMAGE")
  fi
  if [[ "$DRY_RUN" == '1' ]]; then
    BUILD_CMD+=(--dry-run)
  fi

  log "Building and pushing images for $TAG"
  "${BUILD_CMD[@]}"
else
  log "Skip build enabled; skip local build/push"
fi

if [[ "$SKIP_DEPLOY" != '1' ]]; then
  if [[ "$DRY_RUN" != '1' ]]; then
    require_commands ssh
  fi

  if [[ -z "$REMOTE_HOST" ]]; then
    REMOTE_HOST="${ECS_HOST:-}"
  fi
  [[ -n "$REMOTE_HOST" ]] || die "Missing ECS host. Use --ecs-host."

  REMOTE_ENV_PREFIX="IMAGE_TAG='$TAG' DEPLOY_ROOT='$REMOTE_DEPLOY_ROOT'"
  if [[ -n "$REMOTE_STACK_ENV_FILE" ]]; then
    REMOTE_ENV_PREFIX="STACK_ENV_FILE='$REMOTE_STACK_ENV_FILE' $REMOTE_ENV_PREFIX"
  fi

  REMOTE_COMMAND="set -euo pipefail; cd '$REMOTE_DEPLOY_ROOT'; git fetch --tags --force; $REMOTE_ENV_PREFIX ./deploy/ecs/release.sh '$TAG'"

  if [[ "$DRY_RUN" == '1' ]]; then
    log "[dry-run] ssh -p $REMOTE_PORT ${REMOTE_USER}@${REMOTE_HOST} \"$REMOTE_COMMAND\""
  else
    log "Deploying to ECS: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "$REMOTE_COMMAND"
  fi

  if [[ "$SKIP_PUBLIC_CHECK" != '1' ]]; then
    if [[ "$DRY_RUN" != '1' ]]; then
      require_commands curl
    fi

    require_vars RESUME_DOMAIN ADMIN_DOMAIN API_DOMAIN
    if [[ "$DRY_RUN" == '1' ]]; then
      log "[dry-run] Public checks: https://${RESUME_DOMAIN} / https://${ADMIN_DOMAIN}/login / https://${API_DOMAIN}/api"
    else
      curl_check "https://${RESUME_DOMAIN}" "resume-domain"
      curl_check "https://${ADMIN_DOMAIN}/login" "admin-domain"
      curl_check "https://${API_DOMAIN}/api" "api-domain"
    fi
  fi
else
  log "Skip deploy enabled; skip ECS release"
fi

log "Local one-click release completed: $TAG"
