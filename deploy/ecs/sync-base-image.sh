#!/usr/bin/env bash

set -euo pipefail

SOURCE_IMAGE='node:22-slim'
TARGET_REPO=''
TARGET_TAG='22-slim'
STAMP_TAG=''
SKIP_PULL='0'
PLATFORM='linux/amd64'
STACK_ENV_FILE=''

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/sync-base-image.sh \
    --target-repo <registry>/<namespace>/<repo>

  # 或从 stack env 的 DEPLOY_BASE_IMAGE 自动读取目标仓库与 tag
  ./deploy/ecs/sync-base-image.sh \
    --stack-env ./.env.stack.local

Example:
  ./deploy/ecs/sync-base-image.sh \
    --target-repo crpi-xxx.cn-chengdu.personal.cr.aliyuncs.com/team/my-resume-base-node \
    --target-tag 22-slim \
    --stamp-tag 22-slim-20260421

Options:
  --source-image   源镜像，默认 node:22-slim
  --stack-env      读取 DEPLOY_BASE_IMAGE 作为目标镜像（可选）
  --target-repo    目标仓库（必填）
  --target-tag     目标 tag，默认 22-slim
  --stamp-tag      额外的时间戳 tag（可选）
  --platform       镜像平台，默认 linux/amd64
  --skip-pull      跳过 docker pull（默认会先拉源镜像）
  --dry-run        仅打印命令
EOF
}

DRY_RUN='0'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-image)
      SOURCE_IMAGE="$2"
      shift 2
      ;;
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --target-repo)
      TARGET_REPO="${2%/}"
      shift 2
      ;;
    --target-tag)
      TARGET_TAG="$2"
      shift 2
      ;;
    --stamp-tag)
      STAMP_TAG="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --skip-pull)
      SKIP_PULL='1'
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

run_cmd() {
  if [[ "$DRY_RUN" == '1' ]]; then
    echo "[dry-run] $*"
    return 0
  fi

  "$@"
}

read_env_value() {
  local file_path="$1"
  local key="$2"
  local value

  [[ -f "$file_path" ]] || return 0
  value=$(grep -E "^${key}=" "$file_path" | tail -n 1 | cut -d '=' -f 2- || true)
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s\n' "$value"
}

split_image_ref() {
  local image_ref="$1"
  local last_part="${image_ref##*/}"

  if [[ "$last_part" == *':'* ]]; then
    TARGET_REPO="${image_ref%:*}"
    TARGET_TAG="${image_ref##*:}"
  else
    TARGET_REPO="$image_ref"
    TARGET_TAG='latest'
  fi
}

platform_arch() {
  case "$1" in
    linux/amd64)
      printf 'amd64\n'
      ;;
    linux/arm64 | linux/arm64/v8)
      printf 'arm64\n'
      ;;
    *)
      printf '%s\n' "${1#*/}"
      ;;
  esac
}

validate_local_image_platform() {
  local image_ref="$1"
  local platform="$2"
  local expected_os="${platform%%/*}"
  local expected_arch
  local actual_os
  local actual_arch

  expected_arch=$(platform_arch "$platform")
  actual_os=$(docker image inspect "$image_ref" --format '{{.Os}}' 2>/dev/null || true)
  actual_arch=$(docker image inspect "$image_ref" --format '{{.Architecture}}' 2>/dev/null || true)

  if [[ "$actual_os" != "$expected_os" || "$actual_arch" != "$expected_arch" ]]; then
    cat >&2 <<EOF
Source image platform mismatch:
  image    = $image_ref
  expected = $platform
  actual   = ${actual_os:-unknown}/${actual_arch:-unknown}

Remove the stale local image or choose a source image that supports $platform.
EOF
    exit 1
  fi
}

require_commands() {
  local missing=()
  local command_name

  for command_name in "$@"; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
      missing+=("$command_name")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    echo "Missing required commands: ${missing[*]}" >&2
    exit 1
  fi
}

require_commands docker

if [[ -z "$STACK_ENV_FILE" && -z "$TARGET_REPO" && -f .env.stack.local ]]; then
  STACK_ENV_FILE='.env.stack.local'
fi

if [[ -n "$STACK_ENV_FILE" && -z "$TARGET_REPO" ]]; then
  DEPLOY_BASE_IMAGE_VALUE=$(read_env_value "$STACK_ENV_FILE" DEPLOY_BASE_IMAGE)
  if [[ -n "$DEPLOY_BASE_IMAGE_VALUE" ]]; then
    split_image_ref "$DEPLOY_BASE_IMAGE_VALUE"
    echo "Using DEPLOY_BASE_IMAGE from $STACK_ENV_FILE: $DEPLOY_BASE_IMAGE_VALUE"
  fi
fi

if [[ -z "$TARGET_REPO" ]]; then
  echo "Missing required argument: --target-repo or --stack-env with DEPLOY_BASE_IMAGE" >&2
  usage
  exit 1
fi

TARGET_REF="${TARGET_REPO}:${TARGET_TAG}"

echo "Syncing base image:"
echo "  SOURCE_IMAGE = $SOURCE_IMAGE"
echo "  TARGET_REF   = $TARGET_REF"
echo "  PLATFORM     = $PLATFORM"
if [[ -n "$STAMP_TAG" ]]; then
  echo "  STAMP_REF    = ${TARGET_REPO}:${STAMP_TAG}"
fi

if [[ "$SKIP_PULL" != '1' ]]; then
  run_cmd docker pull --platform "$PLATFORM" "$SOURCE_IMAGE"
fi

if [[ "$DRY_RUN" != '1' ]]; then
  validate_local_image_platform "$SOURCE_IMAGE" "$PLATFORM"
fi

run_cmd docker tag "$SOURCE_IMAGE" "$TARGET_REF"
run_cmd docker push "$TARGET_REF"

if [[ -n "$STAMP_TAG" ]]; then
  run_cmd docker tag "$SOURCE_IMAGE" "${TARGET_REPO}:${STAMP_TAG}"
  run_cmd docker push "${TARGET_REPO}:${STAMP_TAG}"
fi

if [[ "$DRY_RUN" != '1' ]]; then
  run_cmd docker manifest inspect "$TARGET_REF" >/dev/null
  echo "Base image sync completed: $TARGET_REF"
fi
