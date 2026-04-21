#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TAG=''
VERSION=''
AUTO_TAG='0'
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
APT_DEBIAN_MIRROR_URL=''
APT_SECURITY_MIRROR_URL=''
SERVICES='all'
REUSE_FROM_TAG=''
SKIP_REUSE_UNSELECTED='0'
SKIP_BUILD='0'
SKIP_DEPLOY='0'
SKIP_PUBLIC_CHECK='0'
AUTO_CREATE_TAG='1'
AUTO_PUSH_TAG='1'

usage() {
  cat <<'EOF'
Usage:
  # 指定 tag
  ./deploy/ecs/release-from-local.sh \
    --tag v2.2.9 \
    --ecs-host <ecs-ip-or-domain> \
    [--ecs-user root] \
    [--ecs-port 22] \
    [--stack-env ./.env.stack.local]

  # 指定 version（自动转 tag）
  ./deploy/ecs/release-from-local.sh \
    --version 2.2.9 \
    --ecs-host <ecs-ip-or-domain>

  # 自动识别当前提交上的 tag（HEAD 正好在 v* tag）
  ./deploy/ecs/release-from-local.sh \
    --auto-tag \
    --ecs-host <ecs-ip-or-domain>

Options:
  --tag                    发布 tag（如 v2.2.9）
  --version                发布版本号（如 2.2.9，会自动转为 v2.2.9）
  --auto-tag               自动识别当前 HEAD 上的发布 tag（匹配 v*）
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
  --apt-debian-mirror-url Debian apt 源覆盖（如 http://mirrors.aliyun.com/debian）
  --apt-security-mirror-url
                           Debian security apt 源覆盖（默认按 debian 源自动推导）
  --services               构建服务范围（all/server/web/admin/server,web...）
  --reuse-from-tag         仅构建部分服务时，未构建服务从该 tag 复制到新 tag
  --skip-reuse-unselected  只构建选中服务，不自动复制未构建服务（高级用法）
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

detect_current_head_tag() {
  git -C "$REPO_ROOT" tag --points-at HEAD --list 'v*' --sort=-v:refname | head -n 1
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

  if [[ "$DRY_RUN" == '1' ]]; then
    log "[dry-run] skip git tag prepare checks for $candidate"
    return 0
  fi

  run_cmd git -C "$REPO_ROOT" fetch origin --tags --force
  run_cmd git -C "$REPO_ROOT" fetch origin main --force

  local current_branch
  current_branch=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)
  if [[ "$current_branch" != 'main' ]]; then
    die "Tag creation is only allowed on main. Current branch: $current_branch"
  fi

  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
    die "Working tree is not clean; refuse to create release tag: $candidate"
  fi

  local ahead_count
  local behind_count
  ahead_count=$(git -C "$REPO_ROOT" rev-list --count origin/main..HEAD)
  behind_count=$(git -C "$REPO_ROOT" rev-list --count HEAD..origin/main)
  if [[ "$ahead_count" != '0' || "$behind_count" != '0' ]]; then
    die "main is not in sync with origin/main (ahead=$ahead_count, behind=$behind_count); push/pull before tagging."
  fi

  if ! git_tag_exists_local "$candidate"; then
    [[ "$AUTO_CREATE_TAG" == '1' ]] || die "Tag not found locally: $candidate"
    run_cmd git -C "$REPO_ROOT" tag -a "$candidate" -m "release: $candidate"
    log "Created local tag: $candidate"
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
    --auto-tag)
      AUTO_TAG='1'
      shift
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
    --apt-debian-mirror-url)
      APT_DEBIAN_MIRROR_URL="$2"
      shift 2
      ;;
    --apt-security-mirror-url)
      APT_SECURITY_MIRROR_URL="$2"
      shift 2
      ;;
    --services)
      SERVICES="$2"
      shift 2
      ;;
    --reuse-from-tag)
      REUSE_FROM_TAG="$2"
      shift 2
      ;;
    --skip-reuse-unselected)
      SKIP_REUSE_UNSELECTED='1'
      shift
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

if [[ "$AUTO_TAG" == '1' && ( -n "$TAG" || -n "$VERSION" ) ]]; then
  die "--auto-tag cannot be used with --tag/--version."
fi

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

if [[ -z "$TAG" ]]; then
  DETECTED_TAG=$(detect_current_head_tag || true)
  if [[ -n "$DETECTED_TAG" ]]; then
    TAG="$DETECTED_TAG"
    log "Auto-detected local HEAD tag: $TAG"
  fi
fi

if [[ -z "$TAG" && -n "${IMAGE_TAG:-}" ]]; then
  TAG=$(normalize_tag "$IMAGE_TAG")
  log "Fallback to IMAGE_TAG from stack env: $TAG"
fi

if [[ -z "$TAG" ]]; then
  if [[ "$AUTO_TAG" == '1' ]]; then
    die "Failed to auto-detect release tag from HEAD. Ensure current commit is tagged (v*)."
  fi
  die "Missing release identifier. Use --tag / --version / --auto-tag, or provide IMAGE_TAG in stack env."
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

if [[ -z "$BASE_IMAGE" && -n "${DEPLOY_BASE_IMAGE:-}" ]]; then
  BASE_IMAGE="${DEPLOY_BASE_IMAGE}"
  log "Using DEPLOY_BASE_IMAGE from stack env: $BASE_IMAGE"
fi

if [[ -z "$APT_DEBIAN_MIRROR_URL" && -n "${DEPLOY_APT_DEBIAN_MIRROR_URL:-}" ]]; then
  APT_DEBIAN_MIRROR_URL="${DEPLOY_APT_DEBIAN_MIRROR_URL}"
  log "Using DEPLOY_APT_DEBIAN_MIRROR_URL from stack env: $APT_DEBIAN_MIRROR_URL"
fi

if [[ -z "$APT_SECURITY_MIRROR_URL" && -n "${DEPLOY_APT_SECURITY_MIRROR_URL:-}" ]]; then
  APT_SECURITY_MIRROR_URL="${DEPLOY_APT_SECURITY_MIRROR_URL}"
  log "Using DEPLOY_APT_SECURITY_MIRROR_URL from stack env: $APT_SECURITY_MIRROR_URL"
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
log "Services selected: $SERVICES"
if [[ -n "$REUSE_FROM_TAG" ]]; then
  log "Reuse from tag: $(normalize_tag "$REUSE_FROM_TAG")"
fi

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
    --services "$SERVICES"
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
  if [[ -n "$APT_DEBIAN_MIRROR_URL" ]]; then
    BUILD_CMD+=(--apt-debian-mirror-url "$APT_DEBIAN_MIRROR_URL")
  fi
  if [[ -n "$APT_SECURITY_MIRROR_URL" ]]; then
    BUILD_CMD+=(--apt-security-mirror-url "$APT_SECURITY_MIRROR_URL")
  fi
  if [[ -n "$REUSE_FROM_TAG" ]]; then
    BUILD_CMD+=(--reuse-from-tag "$REUSE_FROM_TAG")
  fi
  if [[ "$SKIP_REUSE_UNSELECTED" == '1' ]]; then
    BUILD_CMD+=(--skip-reuse-unselected)
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
