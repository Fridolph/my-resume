#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TARGET_BRANCH="${TARGET_BRANCH:-main}"
TAG_PATTERN="${TAG_PATTERN:-v*}"
SKIP_PUBLIC_CHECK="${SKIP_PUBLIC_CHECK:-0}"
TAG_STRATEGY="${TAG_STRATEGY:-latest}"

image_manifests_ready_for_tag() {
  local candidate_tag="$1"

  resolve_image_references "$candidate_tag"

  local refs=("$SERVER_IMAGE_REF" "$WEB_IMAGE_REF" "$ADMIN_IMAGE_REF")
  local ref

  for ref in "${refs[@]}"; do
    if ! docker manifest inspect "$ref" >/dev/null 2>&1; then
      log "Image manifest missing: $ref"
      return 1
    fi
  done

  return 0
}

log "Syncing branch and tags from origin/$TARGET_BRANCH"
run_cmd git -C "$REPO_ROOT" fetch origin "$TARGET_BRANCH" --tags --force
run_cmd git -C "$REPO_ROOT" checkout "$TARGET_BRANCH"
run_cmd git -C "$REPO_ROOT" pull --ff-only origin "$TARGET_BRANCH"

mapfile -t TAG_CANDIDATES < <(git -C "$REPO_ROOT" tag -l "$TAG_PATTERN" --sort=-v:refname)
if (( ${#TAG_CANDIDATES[@]} == 0 )); then
  die "No matching tag found (pattern: $TAG_PATTERN)"
fi

load_stack_env
resolve_deploy_mode

LATEST_TAG="${TAG_CANDIDATES[0]}"

if [[ "$DEPLOY_MODE" == 'image' ]]; then
  docker_registry_login_if_configured

  case "$TAG_STRATEGY" in
    latest)
      if ! image_manifests_ready_for_tag "$LATEST_TAG"; then
        die "Latest tag $LATEST_TAG has no complete image manifests in registry. Push images first, or rerun with TAG_STRATEGY=latest-deployable."
      fi
      ;;
    latest-deployable)
      selected_tag=''
      for candidate_tag in "${TAG_CANDIDATES[@]}"; do
        if image_manifests_ready_for_tag "$candidate_tag"; then
          selected_tag="$candidate_tag"
          break
        fi
      done
      if [[ -z "$selected_tag" ]]; then
        die "No deployable tag found under pattern $TAG_PATTERN (image manifests missing for all tags)."
      fi
      LATEST_TAG="$selected_tag"
      ;;
    *)
      die "Unsupported TAG_STRATEGY: $TAG_STRATEGY (allowed: latest | latest-deployable)"
      ;;
  esac
fi

log "Latest tag selected: $LATEST_TAG"
run_cmd "$SCRIPT_DIR/release.sh" "$LATEST_TAG"
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
