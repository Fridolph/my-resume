#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TAG="${1:-v2.0.0}"

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
RELEASE_DIR="$DEPLOY_ROOT/releases/$RELEASE_NAME"
REPO_CACHE_DIR="$DEPLOY_ROOT/repo"
STATE_DIR="$DEPLOY_ROOT/shared/state"
CURRENT_LINK="$DEPLOY_ROOT/current"
PREVIOUS_RELEASE_FILE="$STATE_DIR/previous-release"
CURRENT_RELEASE_FILE="$STATE_DIR/current-release"
NGINX_HTTP_CONFIG="$DEPLOY_ROOT/shared/nginx/my-resume.http.conf"
NGINX_SSL_CONFIG="$DEPLOY_ROOT/shared/nginx/my-resume.conf"
NGINX_TARGET="/etc/nginx/sites-available/my-resume.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/my-resume.conf"
CERTBOT_CERT_NAME=${CERTBOT_CERT_NAME:-$RESUME_DOMAIN}

mkdir -p "$STATE_DIR" "$DEPLOY_ROOT/releases"

if [[ ! -d "$REPO_CACHE_DIR/.git" ]]; then
  log "Cloning repo cache into $REPO_CACHE_DIR"
  run_cmd git clone "$REPO_URL" "$REPO_CACHE_DIR"
fi

run_cmd git -C "$REPO_CACHE_DIR" fetch --tags --force origin

if ! git -C "$REPO_CACHE_DIR" rev-parse --verify "${TAG}^{tag}" >/dev/null 2>&1 && ! git -C "$REPO_CACHE_DIR" rev-parse --verify "$TAG" >/dev/null 2>&1; then
  die "Tag or ref not found in repo cache: $TAG"
fi

if [[ ! -d "$RELEASE_DIR/.git" && ! -f "$RELEASE_DIR/package.json" ]]; then
  mkdir -p "$RELEASE_DIR"
  log "Creating release snapshot $RELEASE_NAME"
  run_cmd bash -lc "cd '$REPO_CACHE_DIR' && git archive '$TAG' | tar -xf - -C '$RELEASE_DIR'"
else
  log "Release directory already exists, will reuse: $RELEASE_DIR"
fi

run_cmd "$SCRIPT_DIR/render-config.sh" --tag "$TAG" --release-dir "$RELEASE_DIR"

if [[ -L "$CURRENT_LINK" ]]; then
  readlink "$CURRENT_LINK" >"$PREVIOUS_RELEASE_FILE" || true
fi

sudo_cmd cp "$NGINX_HTTP_CONFIG" "$NGINX_TARGET"
sudo_cmd ln -sfn "$NGINX_TARGET" "$NGINX_ENABLED"
sudo_cmd nginx -t
sudo_cmd systemctl reload nginx

if [[ ! -f "/etc/letsencrypt/live/$CERTBOT_CERT_NAME/fullchain.pem" ]]; then
  log "Issuing initial TLS certificate via certbot --nginx"
  sudo_cmd certbot --nginx \
    --non-interactive \
    --agree-tos \
    --redirect \
    --cert-name "$CERTBOT_CERT_NAME" \
    -m "$LETSENCRYPT_EMAIL" \
    -d "$RESUME_DOMAIN" \
    -d "$ADMIN_DOMAIN" \
    -d "$API_DOMAIN"
  run_cmd "$SCRIPT_DIR/render-config.sh" --tag "$TAG" --release-dir "$RELEASE_DIR"
else
  log "TLS certificate already exists for $CERTBOT_CERT_NAME"
fi

sudo_cmd cp "$NGINX_SSL_CONFIG" "$NGINX_TARGET"
sudo_cmd ln -sfn "$NGINX_TARGET" "$NGINX_ENABLED"
sudo_cmd nginx -t
sudo_cmd systemctl reload nginx

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
printf '%s\n' "$RELEASE_DIR" >"$CURRENT_RELEASE_FILE"

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
