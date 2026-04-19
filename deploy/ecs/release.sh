#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TAG="${1:-v2.1.0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      TAG="$1"
      shift
      ;;
  esac
done

load_stack_env
require_commands git docker curl nginx certbot python3
require_vars REPO_URL ROOT_DOMAIN RESUME_DOMAIN ADMIN_DOMAIN API_DOMAIN LETSENCRYPT_EMAIL JWT_SECRET AI_PROVIDER
validate_domain_layout
resolve_ai_runtime_env
resolve_deploy_mode

if [[ "$DEPLOY_MODE" == 'image' ]]; then
  resolve_image_references "$TAG"
fi

RELEASE_NAME=$(sanitize_release_name "$TAG")
RUNTIME_ROOT="$DEPLOY_RUNTIME_ROOT"
RELEASE_DIR="$RUNTIME_ROOT/release-snapshots/$RELEASE_NAME"
REPO_CACHE_DIR="$RUNTIME_ROOT/repo-cache"
STATE_DIR="$RUNTIME_ROOT/shared/state"
CURRENT_LINK="$RUNTIME_ROOT/current"
PREVIOUS_RELEASE_FILE="$STATE_DIR/previous-release"
CURRENT_RELEASE_FILE="$STATE_DIR/current-release"
NGINX_HTTP_CONFIG="$RUNTIME_ROOT/shared/nginx/my-resume.http.conf"
NGINX_SSL_CONFIG="$RUNTIME_ROOT/shared/nginx/my-resume.conf"
CERTBOT_WEBROOT=${CERTBOT_WEBROOT:-/var/www/my-resume-certbot}
CERTBOT_CERT_NAME=${CERTBOT_CERT_NAME:-$RESUME_DOMAIN}
CERTBOT_KEY_TYPE=${CERTBOT_KEY_TYPE:-ecdsa}

mkdir -p "$STATE_DIR" "$RUNTIME_ROOT/release-snapshots"
sudo_cmd mkdir -p "$CERTBOT_WEBROOT"
sudo_cmd chmod 755 "$CERTBOT_WEBROOT"
resolve_nginx_site_layout

if [[ ! -d "$REPO_CACHE_DIR/.git" ]]; then
  log "Cloning repo cache into $REPO_CACHE_DIR"
  run_cmd git clone "$REPO_URL" "$REPO_CACHE_DIR"
fi

run_cmd git -C "$REPO_CACHE_DIR" fetch --tags --force origin

if ! git -C "$REPO_CACHE_DIR" rev-parse --verify "${TAG}^{tag}" >/dev/null 2>&1 && ! git -C "$REPO_CACHE_DIR" rev-parse --verify "$TAG" >/dev/null 2>&1; then
  die "Tag or ref not found in repo cache: $TAG"
fi

SNAPSHOT_TMP_DIR="$RUNTIME_ROOT/release-snapshots/.${RELEASE_NAME}.tmp"
rm -rf "$SNAPSHOT_TMP_DIR"
mkdir -p "$SNAPSHOT_TMP_DIR"
log "Creating release snapshot $RELEASE_NAME"
run_cmd bash -lc "cd '$REPO_CACHE_DIR' && git archive '$TAG' | tar -xf - -C '$SNAPSHOT_TMP_DIR'"
rm -rf "$RELEASE_DIR"
mv "$SNAPSHOT_TMP_DIR" "$RELEASE_DIR"

run_cmd "$SCRIPT_DIR/render-config.sh" --tag "$TAG" --release-dir "$RELEASE_DIR"

if [[ -L "$CURRENT_LINK" ]]; then
  readlink "$CURRENT_LINK" >"$PREVIOUS_RELEASE_FILE" || true
fi

install_nginx_site_config "$NGINX_HTTP_CONFIG"
sudo_cmd nginx -t
sudo_cmd systemctl reload nginx
verify_acme_challenge "$CERTBOT_WEBROOT" "$RESUME_DOMAIN" "$ADMIN_DOMAIN" "$API_DOMAIN"

log "Ensuring TLS certificate via certbot webroot"
sudo_cmd certbot certonly --webroot \
  --non-interactive \
  --agree-tos \
  --keep-until-expiring \
  --expand \
  --cert-name "$CERTBOT_CERT_NAME" \
  --key-type "$CERTBOT_KEY_TYPE" \
  -w "$CERTBOT_WEBROOT" \
  -m "$LETSENCRYPT_EMAIL" \
  -d "$RESUME_DOMAIN" \
  -d "$ADMIN_DOMAIN" \
  -d "$API_DOMAIN"

run_cmd "$SCRIPT_DIR/render-config.sh" --tag "$TAG" --release-dir "$RELEASE_DIR"

install_nginx_site_config "$NGINX_SSL_CONFIG"
sudo_cmd nginx -t
sudo_cmd systemctl reload nginx

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
printf '%s\n' "$RELEASE_DIR" >"$CURRENT_RELEASE_FILE"

cleanup_args=(--stack-env "$STACK_ENV_FILE")
if [[ "$DRY_RUN" == '1' ]]; then
  cleanup_args+=(--dry-run)
fi
run_cmd "$SCRIPT_DIR/pre-release-port-cleanup.sh" "${cleanup_args[@]}"

if [[ "$DEPLOY_MODE" == 'image' ]]; then
  docker_registry_login_if_configured
  compose_cmd "$RELEASE_DIR/compose.prod.yml" "$RELEASE_DIR/.env" pull
  compose_cmd "$RELEASE_DIR/compose.prod.yml" "$RELEASE_DIR/.env" up -d --no-build --remove-orphans
else
  compose_cmd "$RELEASE_DIR/compose.prod.yml" "$RELEASE_DIR/.env" up -d --build --remove-orphans
fi

curl_check "$(healthcheck_url server)" "server"
curl_check "$(healthcheck_url web)" "web"
curl_check "$(healthcheck_url admin)" "admin"

log "Release completed successfully: $TAG (mode: $DEPLOY_MODE)"
