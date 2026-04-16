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
elif command -v dnf >/dev/null 2>&1; then
  sudo_cmd dnf makecache
  sudo_cmd dnf install -y ca-certificates curl git nginx certbot python3 python3-certbot-nginx

  if ! command -v docker >/dev/null 2>&1; then
    if [[ "$(id -u)" -eq 0 ]]; then
      run_cmd bash -lc 'curl -fsSL https://get.docker.com | sh'
    else
      run_cmd bash -lc 'curl -fsSL https://get.docker.com | sudo sh'
    fi
  fi
elif command -v yum >/dev/null 2>&1; then
  sudo_cmd yum makecache
  sudo_cmd yum install -y ca-certificates curl git nginx certbot python3 python3-certbot-nginx

  if ! command -v docker >/dev/null 2>&1; then
    if [[ "$(id -u)" -eq 0 ]]; then
      run_cmd bash -lc 'curl -fsSL https://get.docker.com | sh'
    else
      run_cmd bash -lc 'curl -fsSL https://get.docker.com | sudo sh'
    fi
  fi
else
  die "bootstrap.sh currently supports apt / dnf / yum based Linux only"
fi

resolve_nginx_site_layout

if [[ "$DRY_RUN" != '1' ]] && ! docker compose version >/dev/null 2>&1; then
  die "Docker Compose plugin is required but not available after bootstrap"
fi

sudo_cmd mkdir -p \
  "$DEPLOY_ROOT" \
  "$DEPLOY_RUNTIME_ROOT/repo-cache" \
  "$DEPLOY_RUNTIME_ROOT/release-snapshots" \
  "$DEPLOY_RUNTIME_ROOT/shared/config" \
  "$DEPLOY_RUNTIME_ROOT/shared/data" \
  "$DEPLOY_RUNTIME_ROOT/shared/logs" \
  "$DEPLOY_RUNTIME_ROOT/shared/nginx" \
  "$DEPLOY_RUNTIME_ROOT/shared/state" \
  "$DEPLOY_RUNTIME_ROOT/shared/storage/rag"

sudo_cmd mkdir -p "${CERTBOT_WEBROOT:-/var/www/my-resume-certbot}"
sudo_cmd chmod 755 "${CERTBOT_WEBROOT:-/var/www/my-resume-certbot}"

if [[ "$(id -u)" -ne 0 ]]; then
  sudo_cmd chown -R "$(id -un)":"$(id -gn)" "$DEPLOY_ROOT" "$DEPLOY_RUNTIME_ROOT"
fi

if [[ ! -f "$DEPLOY_RUNTIME_ROOT/shared/config/stack.env.local" ]]; then
  run_cmd cp "$TEMPLATE_DIR/stack.env.example" "$DEPLOY_RUNTIME_ROOT/shared/config/stack.env.local"
  log "Created stack env template: $DEPLOY_RUNTIME_ROOT/shared/config/stack.env.local"
else
  log "Stack env already exists: $DEPLOY_RUNTIME_ROOT/shared/config/stack.env.local"
fi

if [[ -n "${NGINX_ENABLED:-}" ]] && [[ -L /etc/nginx/sites-enabled/default || -f /etc/nginx/sites-enabled/default ]]; then
  sudo_cmd rm -f /etc/nginx/sites-enabled/default
fi

sudo_cmd nginx -t
sudo_cmd systemctl enable nginx
sudo_cmd systemctl restart nginx

log "Detected nginx target: $NGINX_TARGET"
if [[ -n "${NGINX_ENABLED:-}" ]]; then
  log "Detected nginx enabled link: $NGINX_ENABLED"
fi

log "Bootstrap completed. Next: fill $DEPLOY_RUNTIME_ROOT/shared/config/stack.env.local and run release.sh v2.1.0"
