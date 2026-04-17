#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TARGET_BRANCH="${TARGET_BRANCH:-main}"
TAG_PATTERN="${TAG_PATTERN:-v*}"
SKIP_PUBLIC_CHECK="${SKIP_PUBLIC_CHECK:-0}"

log "Syncing branch and tags from origin/$TARGET_BRANCH"
run_cmd git -C "$REPO_ROOT" fetch origin "$TARGET_BRANCH" --tags --force
run_cmd git -C "$REPO_ROOT" checkout "$TARGET_BRANCH"
run_cmd git -C "$REPO_ROOT" pull --ff-only origin "$TARGET_BRANCH"

LATEST_TAG=$(git -C "$REPO_ROOT" tag -l "$TAG_PATTERN" --sort=-v:refname | head -n1 || true)
if [[ -z "$LATEST_TAG" ]]; then
  die "No matching tag found (pattern: $TAG_PATTERN)"
fi

log "Latest tag selected: $LATEST_TAG"
run_cmd "$SCRIPT_DIR/release.sh" "$LATEST_TAG"

load_stack_env
RELEASE_NAME=$(sanitize_release_name "$LATEST_TAG")
RELEASE_DIR="$DEPLOY_RUNTIME_ROOT/release-snapshots/$RELEASE_NAME"

if [[ ! -f "$RELEASE_DIR/compose.prod.yml" || ! -f "$RELEASE_DIR/.env" ]]; then
  die "Release snapshot missing compose files: $RELEASE_DIR"
fi

log "Compose status for $LATEST_TAG"
compose_cmd "$RELEASE_DIR/compose.prod.yml" "$RELEASE_DIR/.env" ps

curl_check "$(healthcheck_url server)" "server-local"
curl_check "$(healthcheck_url web)" "web-local"
curl_check "$(healthcheck_url admin)" "admin-local"

if [[ "$SKIP_PUBLIC_CHECK" != '1' ]]; then
  require_vars RESUME_DOMAIN ADMIN_DOMAIN API_DOMAIN
  curl_check "https://${RESUME_DOMAIN}" "resume-domain"
  curl_check "https://${ADMIN_DOMAIN}/login" "admin-domain"
  curl_check "https://${API_DOMAIN}/api" "api-domain"
fi

log "Deploy + verification completed: $LATEST_TAG"
