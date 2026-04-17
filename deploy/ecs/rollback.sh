#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TARGET_TAG="${1:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      TARGET_TAG="$1"
      shift
      ;;
  esac
done

load_stack_env
require_commands docker curl

RUNTIME_ROOT="$DEPLOY_RUNTIME_ROOT"
STATE_DIR="$RUNTIME_ROOT/shared/state"
PREVIOUS_RELEASE_FILE="$STATE_DIR/previous-release"
CURRENT_RELEASE_FILE="$STATE_DIR/current-release"
CURRENT_LINK="$RUNTIME_ROOT/current"

if [[ -n "$TARGET_TAG" ]]; then
  TARGET_RELEASE="$RUNTIME_ROOT/release-snapshots/$(sanitize_release_name "$TARGET_TAG")"
elif [[ -f "$PREVIOUS_RELEASE_FILE" ]]; then
  TARGET_RELEASE=$(cat "$PREVIOUS_RELEASE_FILE")
else
  die "No target tag provided and no previous release recorded"
fi

[[ -d "$TARGET_RELEASE" ]] || die "Target release does not exist: $TARGET_RELEASE"

TARGET_TAG_NAME=$(basename "$TARGET_RELEASE")

run_cmd "$SCRIPT_DIR/render-config.sh" --tag "$TARGET_TAG_NAME" --release-dir "$TARGET_RELEASE"

if [[ -L "$CURRENT_LINK" ]]; then
  readlink "$CURRENT_LINK" >"$PREVIOUS_RELEASE_FILE" || true
fi

ln -sfn "$TARGET_RELEASE" "$CURRENT_LINK"
printf '%s\n' "$TARGET_RELEASE" >"$CURRENT_RELEASE_FILE"

compose_cmd "$TARGET_RELEASE/compose.prod.yml" "$TARGET_RELEASE/.env" up -d --build --remove-orphans

curl_check "$(healthcheck_url server)" "server"
curl_check "$(healthcheck_url web)" "web"
curl_check "$(healthcheck_url admin)" "admin"

log "Rollback completed successfully -> $(basename "$TARGET_RELEASE")"
