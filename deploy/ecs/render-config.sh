#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

TAG=${TAG:-v2.1.0}
RELEASE_DIR=${RELEASE_DIR:-}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="$2"
      shift 2
      ;;
    --release-dir)
      RELEASE_DIR="$2"
      shift 2
      ;;
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

load_stack_env
require_commands python3
require_vars ROOT_DOMAIN RESUME_DOMAIN ADMIN_DOMAIN API_DOMAIN LETSENCRYPT_EMAIL JWT_SECRET AI_PROVIDER
validate_domain_layout
resolve_ai_runtime_env

RELEASE_NAME=$(sanitize_release_name "$TAG")
RELEASE_DIR=${RELEASE_DIR:-"$DEPLOY_RUNTIME_ROOT/release-snapshots/$RELEASE_NAME"}
export RELEASE_NAME RELEASE_DIR

HOST_SQLITE_DATA_DIR="$DEPLOY_RUNTIME_ROOT/shared/data"
HOST_RAG_DIR="$DEPLOY_RUNTIME_ROOT/shared/storage/rag"
CERTBOT_WEBROOT=${CERTBOT_WEBROOT:-/var/www/my-resume-certbot}
CERTBOT_CERT_NAME=${CERTBOT_CERT_NAME:-$RESUME_DOMAIN}
NGINX_HTTP_CONFIG="$DEPLOY_RUNTIME_ROOT/shared/nginx/my-resume.http.conf"
NGINX_SSL_CONFIG="$DEPLOY_RUNTIME_ROOT/shared/nginx/my-resume.conf"

export HOST_SQLITE_DATA_DIR HOST_RAG_DIR CERTBOT_WEBROOT CERTBOT_CERT_NAME

if [[ "$DRY_RUN" == '1' ]]; then
  log "[dry-run] Would render release config into $RELEASE_DIR"
  log "[dry-run] Would write nginx configs under $DEPLOY_RUNTIME_ROOT/shared/nginx"
  exit 0
fi

mkdir -p "$RELEASE_DIR" "$HOST_SQLITE_DATA_DIR" "$HOST_RAG_DIR" "$(dirname "$NGINX_HTTP_CONFIG")"
sudo_cmd mkdir -p "$CERTBOT_WEBROOT"
sudo_cmd chmod 755 "$CERTBOT_WEBROOT"

write_runtime_env_file "$RELEASE_DIR/.env"
render_template "$TEMPLATE_DIR/compose.prod.yml.tpl" "$RELEASE_DIR/compose.prod.yml"
render_template "$TEMPLATE_DIR/nginx.http.conf.tpl" "$NGINX_HTTP_CONFIG"
render_template "$TEMPLATE_DIR/nginx.conf.tpl" "$NGINX_SSL_CONFIG"

log "Rendered production config:"
log "  env      -> $RELEASE_DIR/.env"
log "  compose  -> $RELEASE_DIR/compose.prod.yml"
log "  nginx80  -> $NGINX_HTTP_CONFIG"
log "  nginx443 -> $NGINX_SSL_CONFIG"
