#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

TAG=''
VERSION=''
AUTO_TAG='0'
IMAGE_PREFIX=''
SERVER_IMAGE=''
WEB_IMAGE=''
ADMIN_IMAGE=''
PLATFORM='linux/amd64'
PUSH='1'
DRY_RUN='0'
BUILDER_NAME='my-resume-builder'
BASE_IMAGE=''
APT_DEBIAN_MIRROR_URL=''
APT_SECURITY_MIRROR_URL=''
ENGINE_BUILD='0'
PUBLIC_API_BASE_URL=''
WEB_SERVER_API_BASE_URL='http://server:5577'
SERVICES='all'
REUSE_FROM_TAG=''
SKIP_REUSE_UNSELECTED='0'

usage() {
  cat <<'EOF'
Usage:
  # 指定 tag
  ./deploy/ecs/build-and-push-images.sh \
    --tag v2.1.0 \
    --image-prefix ghcr.io/<user-or-org>/my-resume

  # 指定 version（自动转 v 前缀）
  ./deploy/ecs/build-and-push-images.sh \
    --version 2.1.0 \
    --image-prefix ghcr.io/<user-or-org>/my-resume

  # 自动识别当前提交上的 tag（例如 HEAD 正好在 v2.1.0）
  ./deploy/ecs/build-and-push-images.sh \
    --auto-tag \
    --image-prefix ghcr.io/<user-or-org>/my-resume

  # 或显式三端镜像仓库
  ./deploy/ecs/build-and-push-images.sh \
    --tag v2.1.0 \
    --server-image ghcr.io/<user-or-org>/my-resume-server \
    --web-image ghcr.io/<user-or-org>/my-resume-web \
    --admin-image ghcr.io/<user-or-org>/my-resume-admin

Options:
  --tag           镜像 tag（如 v2.2.9）
  --version       版本号（如 2.2.9，会自动转为 v2.2.9）
  --auto-tag      自动识别当前 HEAD 上的发布 tag（匹配 v*）
  --image-prefix  镜像前缀（可选，必须全小写），会自动推导：
                  <prefix>/server:<tag>
                  <prefix>/web:<tag>
                  <prefix>/admin:<tag>
  --server-image  显式 server 镜像仓库（与 web/admin 一起使用）
  --web-image     显式 web 镜像仓库（与 server/admin 一起使用）
  --admin-image   显式 admin 镜像仓库（与 server/web 一起使用）
  --platform      默认 linux/amd64
  --engine-build  使用 docker build + docker push（绕过 buildx 网络问题）
  --builder-name  可选，buildx builder 名称（如 default）
  --base-image    可选，覆盖 Dockerfile 基础镜像（用于镜像加速）
                  若未显式传参，可读取环境变量 DEPLOY_BASE_IMAGE
  --apt-debian-mirror-url
                  可选，覆盖 Debian apt 源（如 http://mirrors.aliyun.com/debian）
  --apt-security-mirror-url
                  可选，覆盖 Debian Security apt 源（默认按 debian 源自动推导）
  --public-api-base-url
                  可选，注入 web/admin 的 NEXT_PUBLIC_API_BASE_URL（生产必填）
  --web-server-api-base-url
                  可选，注入 web 的 RESUME_API_BASE_URL，默认 http://server:5577
  --services      构建服务范围，默认 all。支持：
                  all | server | web | admin | server,web | server,admin | web,admin
  --reuse-from-tag
                  当只构建部分服务时，可把未构建服务从该 tag 复制到新 tag
  --skip-reuse-unselected
                  只构建选中服务，不自动复制未构建服务 tag（高级用法）
  --load          本地 load，不 push（调试用）
  --dry-run       只打印命令
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
  if ! command -v git >/dev/null 2>&1; then
    echo "git is required for auto tag detection." >&2
    return 1
  fi

  git -C "$REPO_ROOT" tag --points-at HEAD --list 'v*' --sort=-v:refname | head -n 1
}

normalize_services() {
  local raw="$1"
  raw=$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
  [[ -n "$raw" ]] || raw='all'

  if [[ "$raw" == 'all' ]]; then
    printf 'all\n'
    return 0
  fi

  local has_server='0'
  local has_web='0'
  local has_admin='0'
  local item
  IFS=',' read -r -a items <<<"$raw"
  for item in "${items[@]}"; do
    case "$item" in
      server)
        has_server='1'
        ;;
      web)
        has_web='1'
        ;;
      admin)
        has_admin='1'
        ;;
      all)
        printf 'all\n'
        return 0
        ;;
      *)
        echo "invalid services value: $raw" >&2
        exit 1
        ;;
    esac
  done

  local normalized=()
  [[ "$has_server" == '1' ]] && normalized+=(server)
  [[ "$has_web" == '1' ]] && normalized+=(web)
  [[ "$has_admin" == '1' ]] && normalized+=(admin)

  if (( ${#normalized[@]} == 0 )); then
    echo "services cannot be empty" >&2
    exit 1
  fi

  local joined
  joined=$(IFS=,; printf '%s' "${normalized[*]}")
  printf '%s\n' "$joined"
}

service_selected() {
  local target="$1"
  if [[ "$SERVICES" == 'all' ]]; then
    return 0
  fi

  case ",$SERVICES," in
    *",$target,"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
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
    --image-prefix)
      IMAGE_PREFIX="${2%/}"
      shift 2
      ;;
    --server-image)
      SERVER_IMAGE="${2%/}"
      shift 2
      ;;
    --web-image)
      WEB_IMAGE="${2%/}"
      shift 2
      ;;
    --admin-image)
      ADMIN_IMAGE="${2%/}"
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
    --public-api-base-url)
      PUBLIC_API_BASE_URL="$2"
      shift 2
      ;;
    --web-server-api-base-url)
      WEB_SERVER_API_BASE_URL="$2"
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

if [[ -z "$BASE_IMAGE" && -n "${DEPLOY_BASE_IMAGE:-}" ]]; then
  BASE_IMAGE="${DEPLOY_BASE_IMAGE}"
  echo "Using DEPLOY_BASE_IMAGE from env: $BASE_IMAGE"
fi

if [[ -z "$APT_DEBIAN_MIRROR_URL" && -n "${DEPLOY_APT_DEBIAN_MIRROR_URL:-}" ]]; then
  APT_DEBIAN_MIRROR_URL="${DEPLOY_APT_DEBIAN_MIRROR_URL}"
  echo "Using DEPLOY_APT_DEBIAN_MIRROR_URL from env: $APT_DEBIAN_MIRROR_URL"
fi

if [[ -z "$APT_SECURITY_MIRROR_URL" && -n "${DEPLOY_APT_SECURITY_MIRROR_URL:-}" ]]; then
  APT_SECURITY_MIRROR_URL="${DEPLOY_APT_SECURITY_MIRROR_URL}"
  echo "Using DEPLOY_APT_SECURITY_MIRROR_URL from env: $APT_SECURITY_MIRROR_URL"
fi

if [[ "$AUTO_TAG" == '1' && ( -n "$TAG" || -n "$VERSION" ) ]]; then
  echo "--auto-tag cannot be used with --tag/--version." >&2
  exit 1
fi

if [[ -n "$VERSION" ]]; then
  VERSION_TAG=$(normalize_tag "$VERSION")
  if [[ -z "$TAG" ]]; then
    TAG="$VERSION_TAG"
  fi
fi

if [[ "$AUTO_TAG" == '1' ]]; then
  TAG=$(detect_current_head_tag || true)
  if [[ -z "$TAG" ]]; then
    echo "Failed to auto-detect release tag from HEAD. Use --tag/--version explicitly." >&2
    exit 1
  fi
  echo "Auto-detected tag from HEAD: $TAG"
fi

if [[ -z "$TAG" ]]; then
  HEAD_TAG=$(detect_current_head_tag || true)
  if [[ -n "$HEAD_TAG" ]]; then
    TAG="$HEAD_TAG"
    echo "Auto-detected tag from HEAD: $TAG"
  fi
fi

if [[ -z "$TAG" ]]; then
  usage
  echo "Missing release tag. Use --tag / --version, or ensure HEAD has a v* tag." >&2
  exit 1
fi

TAG=$(normalize_tag "$TAG")

if [[ -n "$VERSION" ]]; then
  VERSION_TAG=$(normalize_tag "$VERSION")
  if [[ "$TAG" != "$VERSION_TAG" ]]; then
    echo "--tag and --version mismatch: $TAG vs $VERSION_TAG" >&2
    exit 1
  fi
fi

if [[ -n "$IMAGE_PREFIX" ]]; then
  LOWER_IMAGE_PREFIX=$(printf '%s' "$IMAGE_PREFIX" | tr '[:upper:]' '[:lower:]')
  if [[ "$IMAGE_PREFIX" != "$LOWER_IMAGE_PREFIX" ]]; then
    echo "image-prefix must be lowercase: $IMAGE_PREFIX" >&2
    echo "Try: --image-prefix $LOWER_IMAGE_PREFIX" >&2
    exit 1
  fi
fi

EXPLICIT_IMAGE_ARGS=0
if [[ -n "$SERVER_IMAGE" || -n "$WEB_IMAGE" || -n "$ADMIN_IMAGE" ]]; then
  EXPLICIT_IMAGE_ARGS=1
fi

if [[ "$EXPLICIT_IMAGE_ARGS" == '1' && -n "$IMAGE_PREFIX" ]]; then
  echo "--image-prefix and explicit images cannot be used together." >&2
  exit 1
fi

if [[ "$EXPLICIT_IMAGE_ARGS" == '1' ]]; then
  if [[ -z "$SERVER_IMAGE" || -z "$WEB_IMAGE" || -z "$ADMIN_IMAGE" ]]; then
    echo "When using explicit images, --server-image/--web-image/--admin-image are all required." >&2
    exit 1
  fi
else
  if [[ -z "$IMAGE_PREFIX" ]]; then
    echo "Either --image-prefix OR explicit --server-image/--web-image/--admin-image is required." >&2
    exit 1
  fi
fi

if [[ "$DRY_RUN" != '1' ]]; then
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
fi

SERVICES=$(normalize_services "$SERVICES")
if [[ -n "$REUSE_FROM_TAG" ]]; then
  REUSE_FROM_TAG=$(normalize_tag "$REUSE_FROM_TAG")
fi

if [[ "$SERVICES" != 'all' && "$PUSH" == '1' && "$SKIP_REUSE_UNSELECTED" != '1' && -z "$REUSE_FROM_TAG" ]]; then
  echo "When --services is partial, --reuse-from-tag is required unless --skip-reuse-unselected is set." >&2
  exit 1
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

if [[ "$EXPLICIT_IMAGE_ARGS" == '1' ]]; then
  SERVER_REPO="${SERVER_IMAGE}"
  WEB_REPO="${WEB_IMAGE}"
  ADMIN_REPO="${ADMIN_IMAGE}"
  SERVER_REF="${SERVER_IMAGE}:${TAG}"
  WEB_REF="${WEB_IMAGE}:${TAG}"
  ADMIN_REF="${ADMIN_IMAGE}:${TAG}"
else
  SERVER_REPO="${IMAGE_PREFIX}/server"
  WEB_REPO="${IMAGE_PREFIX}/web"
  ADMIN_REPO="${IMAGE_PREFIX}/admin"
  SERVER_REF="${IMAGE_PREFIX}/server:${TAG}"
  WEB_REF="${IMAGE_PREFIX}/web:${TAG}"
  ADMIN_REF="${IMAGE_PREFIX}/admin:${TAG}"
fi

copy_image_tag() {
  local repository="$1"
  local source_tag="$2"
  local target_tag="$3"
  local source_ref="${repository}:${source_tag}"
  local target_ref="${repository}:${target_tag}"

  echo "Reuse image tag:"
  echo "  FROM $source_ref"
  echo "  TO   $target_ref"

  run_cmd docker pull "$source_ref"
  run_cmd docker tag "$source_ref" "$target_ref"
  run_cmd docker push "$target_ref"
}

echo "Building images with:"
echo "  TAG            = $TAG"
if [[ "$EXPLICIT_IMAGE_ARGS" == '1' ]]; then
  echo "  IMAGE_MODE     = explicit"
else
  echo "  IMAGE_MODE     = prefix"
  echo "  IMAGE_PREFIX   = $IMAGE_PREFIX"
fi
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
if [[ -n "$APT_DEBIAN_MIRROR_URL" ]]; then
  echo "  APT_DEBIAN     = $APT_DEBIAN_MIRROR_URL"
fi
if [[ -n "$APT_SECURITY_MIRROR_URL" ]]; then
  echo "  APT_SECURITY   = $APT_SECURITY_MIRROR_URL"
fi
if [[ -n "$PUBLIC_API_BASE_URL" ]]; then
  echo "  PUBLIC_API     = $PUBLIC_API_BASE_URL"
fi
echo "  WEB_SERVER_API = $WEB_SERVER_API_BASE_URL"
echo "  SERVICES       = $SERVICES"
if [[ -n "$REUSE_FROM_TAG" ]]; then
  echo "  REUSE_FROM_TAG = $REUSE_FROM_TAG"
fi
if [[ "$SKIP_REUSE_UNSELECTED" == '1' ]]; then
  echo "  SKIP_REUSE     = true"
fi

if [[ "$PUSH" == '1' ]]; then
  PUBLISH_ARGS=(--push)
else
  PUBLISH_ARGS=(--load)
fi

SERVER_APT_BUILD_ARGS=()
if [[ -n "$APT_DEBIAN_MIRROR_URL" ]]; then
  SERVER_APT_BUILD_ARGS+=(--build-arg "APT_DEBIAN_MIRROR_URL=$APT_DEBIAN_MIRROR_URL")
fi
if [[ -n "$APT_SECURITY_MIRROR_URL" ]]; then
  SERVER_APT_BUILD_ARGS+=(--build-arg "APT_SECURITY_MIRROR_URL=$APT_SECURITY_MIRROR_URL")
fi

cd "$REPO_ROOT"
if [[ -n "$BASE_IMAGE" ]]; then
  log_msg="Prefetch base image: $BASE_IMAGE"
  echo "$log_msg"
  run_cmd docker pull "$BASE_IMAGE"
fi

if [[ "$ENGINE_BUILD" == '1' ]]; then
  WEB_BUILD_ARGS=(--build-arg "NEXT_PUBLIC_APP_VERSION=$TAG")
  ADMIN_BUILD_ARGS=(--build-arg "NEXT_PUBLIC_APP_VERSION=$TAG")

  if [[ -n "$PUBLIC_API_BASE_URL" ]]; then
    WEB_BUILD_ARGS+=(--build-arg "NEXT_PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL")
    ADMIN_BUILD_ARGS+=(--build-arg "NEXT_PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL")
  fi

  WEB_BUILD_ARGS+=(--build-arg "RESUME_API_BASE_URL=$WEB_SERVER_API_BASE_URL")

  if [[ -n "$BASE_IMAGE" ]]; then
    if service_selected server; then
      run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${SERVER_APT_BUILD_ARGS[@]+"${SERVER_APT_BUILD_ARGS[@]}"}" .
    fi
    if service_selected web; then
      run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${WEB_BUILD_ARGS[@]}" .
    fi
    if service_selected admin; then
      run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${ADMIN_BUILD_ARGS[@]}" .
    fi
  else
    if service_selected server; then
      run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" "${SERVER_APT_BUILD_ARGS[@]+"${SERVER_APT_BUILD_ARGS[@]}"}" .
    fi
    if service_selected web; then
      run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" "${WEB_BUILD_ARGS[@]}" .
    fi
    if service_selected admin; then
      run_cmd docker build --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" "${ADMIN_BUILD_ARGS[@]}" .
    fi
  fi

  if [[ "$PUSH" == '1' ]]; then
    if service_selected server; then
      run_cmd docker push "$SERVER_REF"
    fi
    if service_selected web; then
      run_cmd docker push "$WEB_REF"
    fi
    if service_selected admin; then
      run_cmd docker push "$ADMIN_REF"
    fi
  fi
else
  WEB_BUILDX_ARGS=(--build-arg "NEXT_PUBLIC_APP_VERSION=$TAG")
  ADMIN_BUILDX_ARGS=(--build-arg "NEXT_PUBLIC_APP_VERSION=$TAG")

  if [[ -n "$PUBLIC_API_BASE_URL" ]]; then
    WEB_BUILDX_ARGS+=(--build-arg "NEXT_PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL")
    ADMIN_BUILDX_ARGS+=(--build-arg "NEXT_PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL")
  fi

  WEB_BUILDX_ARGS+=(--build-arg "RESUME_API_BASE_URL=$WEB_SERVER_API_BASE_URL")

  if [[ -n "$BASE_IMAGE" ]]; then
    if service_selected server; then
      run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${SERVER_APT_BUILD_ARGS[@]+"${SERVER_APT_BUILD_ARGS[@]}"}" "${PUBLISH_ARGS[@]}" .
    fi
    if service_selected web; then
      run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${WEB_BUILDX_ARGS[@]}" "${PUBLISH_ARGS[@]}" .
    fi
    if service_selected admin; then
      run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" --build-arg "BASE_IMAGE=$BASE_IMAGE" "${ADMIN_BUILDX_ARGS[@]}" "${PUBLISH_ARGS[@]}" .
    fi
  else
    if service_selected server; then
      run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/server/Dockerfile -t "$SERVER_REF" "${SERVER_APT_BUILD_ARGS[@]+"${SERVER_APT_BUILD_ARGS[@]}"}" "${PUBLISH_ARGS[@]}" .
    fi
    if service_selected web; then
      run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/web/Dockerfile -t "$WEB_REF" "${WEB_BUILDX_ARGS[@]}" "${PUBLISH_ARGS[@]}" .
    fi
    if service_selected admin; then
      run_cmd docker buildx build --builder "$BUILDER_NAME" --pull=false --platform "$PLATFORM" -f apps/admin/Dockerfile -t "$ADMIN_REF" "${ADMIN_BUILDX_ARGS[@]}" "${PUBLISH_ARGS[@]}" .
    fi
  fi
fi

if [[ "$PUSH" == '1' && "$SERVICES" != 'all' && "$SKIP_REUSE_UNSELECTED" != '1' ]]; then
  if ! service_selected server; then
    copy_image_tag "$SERVER_REPO" "$REUSE_FROM_TAG" "$TAG"
  fi
  if ! service_selected web; then
    copy_image_tag "$WEB_REPO" "$REUSE_FROM_TAG" "$TAG"
  fi
  if ! service_selected admin; then
    copy_image_tag "$ADMIN_REPO" "$REUSE_FROM_TAG" "$TAG"
  fi
fi

echo "Done."
if [[ "$PUSH" == '1' ]]; then
  echo "Pushed target tags:"
  if [[ "$SERVICES" == 'all' || "$SKIP_REUSE_UNSELECTED" != '1' ]]; then
    echo "  $SERVER_REF"
    echo "  $WEB_REF"
    echo "  $ADMIN_REF"
  else
    if service_selected server; then
      echo "  $SERVER_REF"
    fi
    if service_selected web; then
      echo "  $WEB_REF"
    fi
    if service_selected admin; then
      echo "  $ADMIN_REF"
    fi
  fi
else
  echo "Loaded locally:"
  if service_selected server; then
    echo "  $SERVER_REF"
  fi
  if service_selected web; then
    echo "  $WEB_REF"
  fi
  if service_selected admin; then
    echo "  $ADMIN_REF"
  fi
fi
