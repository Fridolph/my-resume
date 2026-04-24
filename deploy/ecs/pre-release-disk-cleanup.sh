#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

MIN_FREE_MB="${DEPLOY_DOCKER_MIN_FREE_MB:-4096}"
AUTO_PRUNE="${DEPLOY_AUTO_DOCKER_PRUNE:-1}"
SNAPSHOT_KEEP="${DEPLOY_RELEASE_SNAPSHOT_KEEP:-5}"

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/pre-release-disk-cleanup.sh [--stack-env <path>] [--min-free-mb <mb>] [--auto-prune 0|1] [--snapshot-keep <n>] [--dry-run]

Options:
  --stack-env      指定 stack env 文件
  --min-free-mb    Docker 根目录可用空间阈值（MB），默认读取 DEPLOY_DOCKER_MIN_FREE_MB，缺省 4096
  --auto-prune     空间不足时是否自动清理 docker 资源，默认读取 DEPLOY_AUTO_DOCKER_PRUNE，缺省 1
  --snapshot-keep  发布快照保留数量，默认读取 DEPLOY_RELEASE_SNAPSHOT_KEEP，缺省 5
  --dry-run        只打印将执行动作
EOF
}

docker_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    docker "$@"
    return 0
  fi

  sudo docker "$@"
}

read_available_mb() {
  local target_path="$1"
  df -Pm "$target_path" | awk 'NR==2 {print $4}'
}

log_disk_status() {
  local docker_root="$1"
  local available_mb="$2"
  local total_mb
  total_mb=$(df -Pm "$docker_root" | awk 'NR==2 {print $2}')
  log "Docker root: $docker_root, free: ${available_mb}MB / ${total_mb}MB"
}

cleanup_release_snapshots() {
  local keep_count="$1"
  local snapshot_dir="$DEPLOY_RUNTIME_ROOT/release-snapshots"

  if [[ ! -d "$snapshot_dir" ]]; then
    return 0
  fi

  if (( keep_count < 1 )); then
    keep_count=1
  fi

  mapfile -t snapshots < <(ls -1dt "$snapshot_dir"/v* 2>/dev/null || true)
  if (( ${#snapshots[@]} <= keep_count )); then
    return 0
  fi

  local remove_from=$keep_count
  local snapshot
  for snapshot in "${snapshots[@]:$remove_from}"; do
    log "Removing stale release snapshot: $snapshot"
    run_cmd rm -rf "$snapshot"
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --min-free-mb)
      MIN_FREE_MB="$2"
      shift 2
      ;;
    --auto-prune)
      AUTO_PRUNE="$2"
      shift 2
      ;;
    --snapshot-keep)
      SNAPSHOT_KEEP="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
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

load_stack_env
require_commands docker df awk

[[ "$MIN_FREE_MB" =~ ^[0-9]+$ ]] || die "--min-free-mb must be an integer"
[[ "$SNAPSHOT_KEEP" =~ ^[0-9]+$ ]] || die "--snapshot-keep must be an integer"
[[ "$AUTO_PRUNE" == '0' || "$AUTO_PRUNE" == '1' ]] || die "--auto-prune must be 0 or 1"

docker_root=$(docker_cmd info --format '{{.DockerRootDir}}')
[[ -n "$docker_root" ]] || die "Unable to resolve Docker root dir"

available_mb=$(read_available_mb "$docker_root")
log_disk_status "$docker_root" "$available_mb"

if (( available_mb >= MIN_FREE_MB )); then
  log "Disk check passed (free ${available_mb}MB >= threshold ${MIN_FREE_MB}MB)"
  exit 0
fi

if [[ "$AUTO_PRUNE" != '1' ]]; then
  die "Disk free ${available_mb}MB is below threshold ${MIN_FREE_MB}MB (auto prune disabled)"
fi

log "Disk free ${available_mb}MB below threshold ${MIN_FREE_MB}MB, starting cleanup"

run_cmd docker_cmd container prune -f
run_cmd docker_cmd image prune -af
run_cmd docker_cmd builder prune -af
run_cmd docker_cmd volume prune -f
run_cmd docker_cmd network prune -f
cleanup_release_snapshots "$SNAPSHOT_KEEP"

available_mb_after=$(read_available_mb "$docker_root")
log_disk_status "$docker_root" "$available_mb_after"

if (( available_mb_after < MIN_FREE_MB )); then
  die "Disk cleanup completed but free space is still low (${available_mb_after}MB < ${MIN_FREE_MB}MB)"
fi

log "Disk cleanup completed, free space restored above threshold"
