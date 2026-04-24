#!/usr/bin/env bash

set -euo pipefail

SOURCE_IMAGE='node:22-slim'
TARGET_REPO=''
TARGET_TAG='22-slim'
STAMP_TAG=''
SKIP_PULL='0'

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/sync-base-image.sh \
    --target-repo <registry>/<namespace>/<repo>

Example:
  ./deploy/ecs/sync-base-image.sh \
    --target-repo crpi-xxx.cn-chengdu.personal.cr.aliyuncs.com/team/my-resume-base-node \
    --target-tag 22-slim \
    --stamp-tag 22-slim-20260421

Options:
  --source-image   源镜像，默认 node:22-slim
  --target-repo    目标仓库（必填）
  --target-tag     目标 tag，默认 22-slim
  --stamp-tag      额外的时间戳 tag（可选）
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

if [[ -z "$TARGET_REPO" ]]; then
  echo "Missing required argument: --target-repo" >&2
  usage
  exit 1
fi

run_cmd() {
  if [[ "$DRY_RUN" == '1' ]]; then
    echo "[dry-run] $*"
    return 0
  fi

  "$@"
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

TARGET_REF="${TARGET_REPO}:${TARGET_TAG}"

echo "Syncing base image:"
echo "  SOURCE_IMAGE = $SOURCE_IMAGE"
echo "  TARGET_REF   = $TARGET_REF"
if [[ -n "$STAMP_TAG" ]]; then
  echo "  STAMP_REF    = ${TARGET_REPO}:${STAMP_TAG}"
fi

if [[ "$SKIP_PULL" != '1' ]]; then
  run_cmd docker pull "$SOURCE_IMAGE"
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
