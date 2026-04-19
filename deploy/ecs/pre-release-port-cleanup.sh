#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

KEEP_PROJECT=''
PORTS=()

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/pre-release-port-cleanup.sh [--stack-env <path>] [--keep-project <name>] [--port <port>]... [--dry-run]

Options:
  --stack-env      指定 stack env 文件
  --keep-project   当前保留的 compose project（默认自动解析）
  --port           需要清理冲突的 host 端口，可重复传入；默认 5577 5555 5566
  --dry-run        只打印将执行的清理动作
EOF
}

docker_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    docker "$@"
    return 0
  fi

  sudo docker "$@"
}

is_my_resume_service() {
  local service_name="$1"
  case "$service_name" in
    server | web | admin)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --keep-project)
      KEEP_PROJECT="$2"
      shift 2
      ;;
    --port)
      PORTS+=("$2")
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

if [[ "$DRY_RUN" == '1' ]] && ! command -v docker >/dev/null 2>&1; then
  log "[dry-run] docker command not found, skip container inspection"
  exit 0
fi

require_commands docker

if (( ${#PORTS[@]} == 0 )); then
  PORTS=(5577 5555 5566)
fi

if [[ -z "$KEEP_PROJECT" ]]; then
  KEEP_PROJECT=$(resolve_compose_project_name)
else
  KEEP_PROJECT=$(normalize_compose_project_name "$KEEP_PROJECT")
fi

log "Port conflict pre-clean target project: $KEEP_PROJECT"

for port in "${PORTS[@]}"; do
  mapfile -t container_ids < <(docker_cmd ps -q --filter "publish=${port}")
  if (( ${#container_ids[@]} == 0 )); then
    log "Port $port is free"
    continue
  fi

  for container_id in "${container_ids[@]}"; do
    container_name=$(docker_cmd inspect --format '{{.Name}}' "$container_id" | sed 's#^/##')
    compose_project=$(docker_cmd inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$container_id")
    compose_service=$(docker_cmd inspect --format '{{ index .Config.Labels "com.docker.compose.service" }}' "$container_id")

    if [[ "$compose_project" == "$KEEP_PROJECT" ]]; then
      log "Port $port in-use by current project container, keep: $container_name"
      continue
    fi

    if ! is_my_resume_service "$compose_service"; then
      log "Port $port occupied by non-target container, skip cleanup: $container_name (project=${compose_project:-n/a}, service=${compose_service:-n/a})"
      continue
    fi

    log "Removing stale container on port $port: $container_name (project=${compose_project:-n/a}, service=${compose_service})"
    run_cmd docker_cmd rm -f "$container_id"
  done

  mapfile -t remaining_ids < <(docker_cmd ps -q --filter "publish=${port}")
  if (( ${#remaining_ids[@]} == 0 )); then
    log "Port $port cleanup complete"
    continue
  fi

  unresolved=0
  for container_id in "${remaining_ids[@]}"; do
    compose_project=$(docker_cmd inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$container_id")
    if [[ "$compose_project" != "$KEEP_PROJECT" ]]; then
      unresolved=1
      container_name=$(docker_cmd inspect --format '{{.Name}}' "$container_id" | sed 's#^/##')
      compose_service=$(docker_cmd inspect --format '{{ index .Config.Labels "com.docker.compose.service" }}' "$container_id")
      log "Unresolved port $port holder: $container_name (project=${compose_project:-n/a}, service=${compose_service:-n/a})"
    fi
  done

  if (( unresolved == 1 )); then
    die "Port $port still occupied by non-current project containers"
  fi
done

log "Port conflict pre-clean completed"
