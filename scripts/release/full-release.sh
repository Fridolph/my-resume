#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

# ── defaults ──────────────────────────────────────────────────────────
TAG=''
VERSION=''
SKIP_CHANGELOG='0'
SKIP_GITHUB='0'
SKIP_BUILD='0'
SKIP_DEPLOY='0'
ECS_HOST=''
ECS_USER='root'
ECS_PORT='22'
SSH_TARGET=''
DRY_RUN='0'
AUTO_COMMIT_CHANGELOG='1'
CHANGELOG_FILE='CHANGELOG.md'

# ── helpers ───────────────────────────────────────────────────────────
log() { printf '\033[1;34m[release]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[release] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }
run()  { [[ "$DRY_RUN" == '1' ]] && { log "[dry-run] $*"; return 0; }; "$@"; }
run_safe() { "$@" || true; }
normalize_tag() { [[ "$1" == v* ]] && printf '%s\n' "$1" || printf 'v%s\n' "$1"; }

detect_head_tag() {
  git -C "$REPO_ROOT" tag --points-at HEAD --list 'v*' --sort=-v:refname | head -n 1
}

detect_prev_tag() {
  local tid="$1"
  git -C "$REPO_ROOT" describe --tags --match 'v*' --abbrev=0 "${tid}^" 2>/dev/null || true
}

usage() {
  cat <<'EOF'
Usage:
  pnpm release -- --tag v2.2.24 --ecs-host 1.2.3.4
  pnpm release -- --version 2.2.24 --ecs-host 1.2.3.4 --skip-github

Options:
  --tag             发布 tag（如 v2.2.24）
  --version         版本号（如 2.2.24，自动转 v2.2.24）
  --ecs-host        ECS 主机地址（跳过部署时可不填）
  --ecs-user        ECS SSH 用户，默认 root
  --ecs-port        ECS SSH 端口，默认 22
  --ssh-target      使用 ~/.ssh/config 别名
  --skip-changelog  跳过 CHANGELOG 生成
  --skip-github     跳过 GitHub Release 创建
  --skip-build      跳过 Docker 镜像构建推送
  --skip-deploy     跳过远程 ECS 部署
  --no-auto-commit  CHANGELOG 生成后不自动 git commit
  --dry-run         仅打印命令，不执行
EOF
  exit "${1:-0}"
}

# ── parse args ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)              TAG="$2"; shift 2 ;;
    --version)          VERSION="$2"; shift 2 ;;
    --ecs-host)         ECS_HOST="$2"; shift 2 ;;
    --ecs-user)         ECS_USER="$2"; shift 2 ;;
    --ecs-port)         ECS_PORT="$2"; shift 2 ;;
    --ssh-target)       SSH_TARGET="$2"; shift 2 ;;
    --skip-changelog)   SKIP_CHANGELOG='1'; shift ;;
    --skip-github)      SKIP_GITHUB='1'; shift ;;
    --skip-build)       SKIP_BUILD='1'; shift ;;
    --skip-deploy)      SKIP_DEPLOY='1'; shift ;;
    --no-auto-commit)   AUTO_COMMIT_CHANGELOG='0'; shift ;;
    --dry-run)          DRY_RUN='1'; shift ;;
    -h|--help)          usage 0 ;;
    *)                  err "Unknown argument: $1" ;;
  esac
done

# ── resolve tag ───────────────────────────────────────────────────────
if [[ -n "$VERSION" ]]; then
  VERSION_TAG=$(normalize_tag "$VERSION")
  [[ -n "$TAG" && "$TAG" != "$VERSION_TAG" ]] && err "--tag and --version mismatch"
  TAG="$VERSION_TAG"
fi
[[ -z "$TAG" ]] && TAG=$(detect_head_tag || true)
[[ -z "$TAG" ]] && err "No tag found. Use --tag/--version, or tag current HEAD."

TAG=$(normalize_tag "$TAG")
PREVIOUS_TAG=$(detect_prev_tag "$TAG" || true)

log "Release tag: $TAG"
[[ -n "$PREVIOUS_TAG" ]] && log "Previous tag: $PREVIOUS_TAG"

# ── prerequisites ─────────────────────────────────────────────────────
cd "$REPO_ROOT"

CURRENT_BRANCH=$(run_safe git rev-parse --abbrev-ref HEAD)
[[ "$CURRENT_BRANCH" == 'main' ]] || err "Must be on main branch. Current: $CURRENT_BRANCH"

DIRTY=$(run_safe git status --porcelain)
[[ "$DRY_RUN" == '1' || -z "$DIRTY" ]] || err "Working tree is dirty. Commit or stash changes first."

# ── 1) CHANGELOG ──────────────────────────────────────────────────────
if [[ "$SKIP_CHANGELOG" != '1' ]]; then
  log "Generating CHANGELOG for $TAG"

  CHANGELOG_ARGS=(write --tag "$TAG" --to HEAD --file "$CHANGELOG_FILE")
  [[ -n "$PREVIOUS_TAG" ]] && CHANGELOG_ARGS+=(--from "$PREVIOUS_TAG")

  if [[ "$DRY_RUN" == '1' ]]; then
    log "[dry-run] node scripts/release/changelog.mjs ${CHANGELOG_ARGS[*]}"
  else
    node "$REPO_ROOT/scripts/release/changelog.mjs" "${CHANGELOG_ARGS[@]}"
    log "CHANGELOG written to $CHANGELOG_FILE"

    if [[ "$AUTO_COMMIT_CHANGELOG" == '1' ]]; then
      if git diff --quiet "$CHANGELOG_FILE"; then
        log "CHANGELOG unchanged, skip commit"
      else
        run git add "$CHANGELOG_FILE"
        run git commit -m "docs(changelog): prepare $TAG release notes"
        log "CHANGELOG committed"
      fi
    fi
  fi
fi

# ── 2) Create tag if missing ──────────────────────────────────────────
TAG_EXISTS='0'
git rev-parse --verify "${TAG}^{tag}" >/dev/null 2>&1 && TAG_EXISTS='1' || true
if [[ "$TAG_EXISTS" == '0' ]]; then
  log "Creating tag: $TAG"
  git tag -a "$TAG" -m "release: $TAG"
  log "Tag created: $TAG"
else
  log "Tag already exists: $TAG"
fi

# ── 3) Push main + tag ────────────────────────────────────────────────
log "Pushing main and tag to origin"
git push origin main
git push origin "$TAG"

# ── 4) Build & push Docker images + deploy ────────────────────────────
RELEASE_ARGS=(--tag "$TAG")
[[ "$SKIP_BUILD" == '1' ]] && RELEASE_ARGS+=(--skip-build)
[[ "$SKIP_DEPLOY" == '1' ]] && RELEASE_ARGS+=(--skip-deploy)
[[ "$DRY_RUN" == '1' ]] && RELEASE_ARGS+=(--dry-run)

if [[ -n "$ECS_HOST" || -n "$SSH_TARGET" ]]; then
  if [[ -n "$SSH_TARGET" ]]; then
    RELEASE_ARGS+=(--ssh-target "$SSH_TARGET")
  else
    RELEASE_ARGS+=(--ecs-host "$ECS_HOST" --ecs-user "$ECS_USER" --ecs-port "$ECS_PORT")
  fi
fi

# Load stack env from .env.stack.local by default
if [[ -f "$REPO_ROOT/.env.stack.local" ]]; then
  RELEASE_ARGS+=(--stack-env "$REPO_ROOT/.env.stack.local")
fi

log "Building images and deploying..."
run "$SCRIPT_DIR/../ecs/release-from-local.sh" "${RELEASE_ARGS[@]}"

# ── 5) GitHub Release ─────────────────────────────────────────────────
if [[ "$SKIP_GITHUB" != '1' ]]; then
  log "Creating GitHub Release for $TAG"
  GITHUB_ARGS=(--tag "$TAG" --title "$TAG")
  [[ "$DRY_RUN" == '1' ]] && GITHUB_ARGS+=(--draft)

  if [[ "$DRY_RUN" == '1' ]]; then
    log "[dry-run] node scripts/release/github-release.mjs ${GITHUB_ARGS[*]}"
  else
    node "$REPO_ROOT/scripts/release/github-release.mjs" "${GITHUB_ARGS[@]}"
    log "GitHub Release created for $TAG"
  fi
fi

# ── done ───────────────────────────────────────────────────────────────
echo ''
log "===================="
log "Release completed: $TAG"
log "===================="
