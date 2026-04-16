#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
TEMPLATE_DIR="$REPO_ROOT/deploy/templates"

DEPLOY_ROOT=${DEPLOY_ROOT:-/opt/my-resume}
STACK_ENV_FILE=${STACK_ENV_FILE:-}
DRY_RUN=${DRY_RUN:-0}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

run_cmd() {
  if [[ "$DRY_RUN" == '1' ]]; then
    log "[dry-run] $*"
    return 0
  fi

  "$@"
}

sudo_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    run_cmd "$@"
    return 0
  fi

  run_cmd sudo "$@"
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
    die "Missing required commands: ${missing[*]}"
  fi
}

resolve_stack_env_path() {
  if [[ -n "$STACK_ENV_FILE" ]]; then
    printf '%s\n' "$STACK_ENV_FILE"
    return 0
  fi

  if [[ -f "$REPO_ROOT/deploy/ecs/stack.env" ]]; then
    printf '%s\n' "$REPO_ROOT/deploy/ecs/stack.env"
    return 0
  fi

  printf '%s\n' "$DEPLOY_ROOT/shared/config/stack.env"
}

load_stack_env() {
  local env_file
  env_file=$(resolve_stack_env_path)

  if [[ ! -f "$env_file" ]]; then
    die "Stack env not found: $env_file"
  fi

  STACK_ENV_FILE="$env_file"
  export STACK_ENV_FILE

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
}

require_vars() {
  local name

  for name in "$@"; do
    if [[ -z "${!name:-}" ]]; then
      die "Required variable is missing: $name"
    fi
  done
}

validate_domain_layout() {
  require_vars ROOT_DOMAIN RESUME_DOMAIN ADMIN_DOMAIN API_DOMAIN

  if [[ "$RESUME_DOMAIN" == "$ADMIN_DOMAIN" || "$RESUME_DOMAIN" == "$API_DOMAIN" || "$ADMIN_DOMAIN" == "$API_DOMAIN" ]]; then
    die "RESUME_DOMAIN / ADMIN_DOMAIN / API_DOMAIN must be distinct"
  fi
}

sanitize_release_name() {
  local value="$1"

  value=${value//\//-}
  value=${value//:/-}
  value=${value// /-}
  value=${value//[^A-Za-z0-9._-]/-}
  printf '%s\n' "$value"
}

render_template() {
  local template_path="$1"
  local output_path="$2"

  [[ -f "$template_path" ]] || die "Template not found: $template_path"

  mkdir -p "$(dirname "$output_path")"

  TEMPLATE_PATH="$template_path" OUTPUT_PATH="$output_path" python3 <<'PY'
import os
import pathlib
import re
import sys

template_path = pathlib.Path(os.environ["TEMPLATE_PATH"])
output_path = pathlib.Path(os.environ["OUTPUT_PATH"])
content = template_path.read_text(encoding="utf-8")

pattern = re.compile(r"__([A-Z0-9_]+)__")
missing = sorted({match.group(1) for match in pattern.finditer(content) if match.group(1) not in os.environ})
if missing:
    sys.stderr.write(f"Missing template variables: {', '.join(missing)}\n")
    sys.exit(1)

def replacer(match):
    return os.environ[match.group(1)]

output_path.write_text(pattern.sub(replacer, content), encoding="utf-8")
PY
}

resolve_ai_runtime_env() {
  local provider

  provider=$(printf '%s' "${AI_PROVIDER:-}" | tr '[:upper:]' '[:lower:]')
  AI_PROVIDER="$provider"
  export AI_PROVIDER

  case "$provider" in
    mock)
      ;;
    qiniu)
      require_vars QINIU_AI_API_KEY QINIU_AI_BASE_URL QINIU_AI_MODEL
      ;;
    deepseek)
      require_vars DEEPSEEK_API_KEY DEEPSEEK_BASE_URL DEEPSEEK_MODEL
      ;;
    openai-compatible)
      require_vars OPENAI_COMPATIBLE_API_KEY OPENAI_COMPATIBLE_BASE_URL OPENAI_COMPATIBLE_MODEL
      ;;
    *)
      die "Unsupported AI_PROVIDER: ${AI_PROVIDER:-<empty>}"
      ;;
  esac
}

write_runtime_env_file() {
  local output_path="$1"

  cat >"$output_path" <<EOF
NODE_ENV=production
PORT=5577
API_HOST=0.0.0.0
CORS_ORIGINS=https://${RESUME_DOMAIN},https://${ADMIN_DOMAIN}
NEXT_PUBLIC_API_BASE_URL=https://${API_DOMAIN}
RESUME_API_BASE_URL=http://server:5577
DATABASE_URL=file:/app/.data/my-resume.db
JWT_SECRET=${JWT_SECRET}
AI_PROVIDER=${AI_PROVIDER}
EOF

  case "$AI_PROVIDER" in
    qiniu)
      cat >>"$output_path" <<EOF
QINIU_AI_API_KEY=${QINIU_AI_API_KEY}
QINIU_AI_BASE_URL=${QINIU_AI_BASE_URL}
QINIU_AI_MODEL=${QINIU_AI_MODEL}
EOF
      if [[ -n "${QINIU_AI_CHAT_MODEL:-}" ]]; then
        printf 'QINIU_AI_CHAT_MODEL=%s\n' "$QINIU_AI_CHAT_MODEL" >>"$output_path"
      fi
      if [[ -n "${QINIU_AI_EMBEDDING_MODEL:-}" ]]; then
        printf 'QINIU_AI_EMBEDDING_MODEL=%s\n' "$QINIU_AI_EMBEDDING_MODEL" >>"$output_path"
      fi
      ;;
    deepseek)
      cat >>"$output_path" <<EOF
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
DEEPSEEK_BASE_URL=${DEEPSEEK_BASE_URL}
DEEPSEEK_MODEL=${DEEPSEEK_MODEL}
EOF
      ;;
    openai-compatible)
      cat >>"$output_path" <<EOF
OPENAI_COMPATIBLE_API_KEY=${OPENAI_COMPATIBLE_API_KEY}
OPENAI_COMPATIBLE_BASE_URL=${OPENAI_COMPATIBLE_BASE_URL}
OPENAI_COMPATIBLE_MODEL=${OPENAI_COMPATIBLE_MODEL}
EOF
      ;;
  esac
}

compose_cmd() {
  local compose_file="$1"
  local env_file="$2"
  shift 2

  sudo_cmd docker compose -f "$compose_file" --env-file "$env_file" "$@"
}

healthcheck_url() {
  case "$1" in
    server)
      printf '%s\n' 'http://127.0.0.1:5577/'
      ;;
    web)
      printf '%s\n' 'http://127.0.0.1:5555/zh'
      ;;
    admin)
      printf '%s\n' 'http://127.0.0.1:5566/zh'
      ;;
    *)
      die "Unknown service for healthcheck: $1"
      ;;
  esac
}

curl_check() {
  local url="$1"
  local label="$2"

  if curl --fail --silent --show-error --max-time 20 "$url" >/dev/null; then
    log "Healthcheck passed: $label -> $url"
    return 0
  fi

  die "Healthcheck failed: $label -> $url"
}
