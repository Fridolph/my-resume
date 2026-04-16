#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

if [[ "${1:-}" == '--dry-run' ]]; then
  DRY_RUN=1
fi

require_commands bash sed awk

log "Bootstrapping ECS host under $DEPLOY_ROOT"

if command -v apt-get >/dev/null 2>&1; then
  sudo_cmd apt-get update
  sudo_cmd apt-get install -y ca-certificates curl git nginx certbot python3 python3-certbot-nginx

  if ! command -v docker >/dev/null 2>&1; then
    if [[ "$(id -u)" -eq 0 ]]; then
      run_cmd bash -lc 'curl -fsSL https://get.docker.com | sh'
    else
      run_cmd bash -lc 'curl -fsSL https://get.docker.com | sudo sh'
    fi
  fi
else
  die "bootstrap.sh currently supports apt-based Linux only"
fi

if [[ "$DRY_RUN" != '1' ]] && ! docker compose version >/dev/null 2>&1; then
  die "Docker Compose plugin is required but not available after bootstrap"
fi

sudo_cmd mkdir -p \
  "$DEPLOY_ROOT" \
  "$DEPLOY_ROOT/releases" \
  "$DEPLOY_ROOT/shared/config" \
  "$DEPLOY_ROOT/shared/data" \
  "$DEPLOY_ROOT/shared/logs" \
  "$DEPLOY_ROOT/shared/nginx" \
  "$DEPLOY_ROOT/shared/certbot/www" \
  "$DEPLOY_ROOT/shared/state" \
  "$DEPLOY_ROOT/shared/storage/rag"

if [[ "$(id -u)" -ne 0 ]]; then
  sudo_cmd chown -R "$(id -un)":"$(id -gn)" "$DEPLOY_ROOT"
fi

if [[ ! -f "$DEPLOY_ROOT/shared/config/stack.env" ]]; then
  run_cmd cp "$TEMPLATE_DIR/stack.env.example" "$DEPLOY_ROOT/shared/config/stack.env"
  log "Created stack env template: $DEPLOY_ROOT/shared/config/stack.env"
else
  log "Stack env already exists: $DEPLOY_ROOT/shared/config/stack.env"
fi

if [[ -L /etc/nginx/sites-enabled/default || -f /etc/nginx/sites-enabled/default ]]; then
  sudo_cmd rm -f /etc/nginx/sites-enabled/default
fi

sudo_cmd nginx -t
sudo_cmd systemctl enable nginx
sudo_cmd systemctl restart nginx

log "Bootstrap completed. Next: fill $DEPLOY_ROOT/shared/config/stack.env and run release.sh v2.0.0"
