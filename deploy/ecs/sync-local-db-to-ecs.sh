#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

LOCAL_DB_PATH="$REPO_ROOT/.data/my-resume.db"
LOCAL_RAG_SNAPSHOT_PATH="$REPO_ROOT/.data/rag-vector-snapshot.json"
REMOTE_HOST=''
REMOTE_PORT='22'
REMOTE_USER='root'
REMOTE_SSH_TARGET=''
REMOTE_DEPLOY_ROOT=''
REMOTE_DB_PATH=''
REMOTE_BACKUP_DIR=''
REMOTE_STACK_ENV_FILE=''
REMOTE_RAG_SNAPSHOT_PATH=''
SYNC_RAG_SNAPSHOT='0'
SKIP_RESTART='0'

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/sync-local-db-to-ecs.sh \
    --ssh-target fri \
    --stack-env ./.env.stack.local

Examples:
  # 只同步本地 SQLite 到生产，并在远端重启 server
  ./deploy/ecs/sync-local-db-to-ecs.sh \
    --ssh-target fri \
    --stack-env ./.env.stack.local

  # 同步 SQLite + RAG snapshot（适合生产使用 snapshot 向量后端）
  ./deploy/ecs/sync-local-db-to-ecs.sh \
    --ssh-target fri \
    --stack-env ./.env.stack.local \
    --sync-rag-snapshot

Options:
  --local-db-path         本地 SQLite 文件，默认 ./.data/my-resume.db
  --local-rag-snapshot    本地 RAG snapshot 文件，默认 ./.data/rag-vector-snapshot.json
  --stack-env             本地 stack env 文件路径（默认优先 ./.env.stack.local）
  --ecs-host              ECS 主机（除非使用 --ssh-target）
  --ecs-user              ECS SSH 用户，默认 root
  --ecs-port              ECS SSH 端口，默认 22
  --ssh-target            SSH 别名或完整目标，如 fri / root@host
  --remote-deploy-root    远端部署根目录，默认读取 stack env 的 DEPLOY_ROOT
  --remote-stack-env      远端 stack env 路径（可选）
  --remote-db-path        远端 SQLite 目标路径（默认 <deploy-root>/.deploy-runtime/shared/data/my-resume.db）
  --remote-backup-dir     远端备份目录（默认 <deploy-root>/.deploy-runtime/shared/data/backups）
  --sync-rag-snapshot     同步本地 rag-vector-snapshot.json 到远端 shared/storage/rag
  --remote-rag-snapshot   远端 RAG snapshot 目标路径（默认 <deploy-root>/.deploy-runtime/shared/storage/rag/rag-vector-snapshot.json）
  --skip-restart          上传完成后不自动重启 server
  --dry-run               只打印将执行的动作
EOF
}

ssh_cmd() {
  if [[ -n "$REMOTE_SSH_TARGET" ]]; then
    run_cmd ssh -o BatchMode=yes "$REMOTE_SSH_TARGET" "$@"
    return 0
  fi

  run_cmd ssh -o BatchMode=yes -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "$@"
}

scp_cmd() {
  if [[ -n "$REMOTE_SSH_TARGET" ]]; then
    run_cmd scp -o BatchMode=yes "$@"
    return 0
  fi

  run_cmd scp -o BatchMode=yes -P "$REMOTE_PORT" "$@"
}

remote_scp_target() {
  local remote_path="$1"

  if [[ -n "$REMOTE_SSH_TARGET" ]]; then
    printf '%s:%s\n' "$REMOTE_SSH_TARGET" "$remote_path"
    return 0
  fi

  printf '%s@%s:%s\n' "$REMOTE_USER" "$REMOTE_HOST" "$remote_path"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local-db-path)
      LOCAL_DB_PATH="$2"
      shift 2
      ;;
    --local-rag-snapshot)
      LOCAL_RAG_SNAPSHOT_PATH="$2"
      shift 2
      ;;
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --ecs-host)
      REMOTE_HOST="$2"
      shift 2
      ;;
    --ecs-user)
      REMOTE_USER="$2"
      shift 2
      ;;
    --ecs-port)
      REMOTE_PORT="$2"
      shift 2
      ;;
    --ssh-target)
      REMOTE_SSH_TARGET="$2"
      shift 2
      ;;
    --remote-deploy-root)
      REMOTE_DEPLOY_ROOT="$2"
      shift 2
      ;;
    --remote-stack-env)
      REMOTE_STACK_ENV_FILE="$2"
      shift 2
      ;;
    --remote-db-path)
      REMOTE_DB_PATH="$2"
      shift 2
      ;;
    --remote-backup-dir)
      REMOTE_BACKUP_DIR="$2"
      shift 2
      ;;
    --sync-rag-snapshot)
      SYNC_RAG_SNAPSHOT='1'
      shift
      ;;
    --remote-rag-snapshot)
      REMOTE_RAG_SNAPSHOT_PATH="$2"
      shift 2
      ;;
    --skip-restart)
      SKIP_RESTART='1'
      shift
      ;;
    --dry-run)
      DRY_RUN='1'
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

load_stack_env
require_commands ssh scp

if [[ -z "$REMOTE_DEPLOY_ROOT" ]]; then
  REMOTE_DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/my-resume}"
fi

if [[ -z "$REMOTE_DB_PATH" ]]; then
  REMOTE_DB_PATH="$REMOTE_DEPLOY_ROOT/.deploy-runtime/shared/data/my-resume.db"
fi

if [[ -z "$REMOTE_BACKUP_DIR" ]]; then
  REMOTE_BACKUP_DIR="$REMOTE_DEPLOY_ROOT/.deploy-runtime/shared/data/backups"
fi

if [[ -z "$REMOTE_RAG_SNAPSHOT_PATH" ]]; then
  REMOTE_RAG_SNAPSHOT_PATH="$REMOTE_DEPLOY_ROOT/.deploy-runtime/shared/storage/rag/rag-vector-snapshot.json"
fi

if [[ -z "$REMOTE_SSH_TARGET" && -z "$REMOTE_HOST" ]]; then
  REMOTE_HOST="${ECS_HOST:-}"
fi

[[ -n "$REMOTE_SSH_TARGET" || -n "$REMOTE_HOST" ]] || die "Missing ECS host. Use --ecs-host or --ssh-target."
[[ -f "$LOCAL_DB_PATH" ]] || die "Local database file not found: $LOCAL_DB_PATH"

if [[ "$SYNC_RAG_SNAPSHOT" == '1' ]]; then
  [[ -f "$LOCAL_RAG_SNAPSHOT_PATH" ]] || die "Local RAG snapshot file not found: $LOCAL_RAG_SNAPSHOT_PATH"
fi

DB_TMP_PATH="${REMOTE_DB_PATH}.uploading.$(date '+%Y%m%d%H%M%S')"
RAG_TMP_PATH="${REMOTE_RAG_SNAPSHOT_PATH}.uploading.$(date '+%Y%m%d%H%M%S')"
REMOTE_ENV_PREFIX="DEPLOY_ROOT='$REMOTE_DEPLOY_ROOT'"
if [[ -n "$REMOTE_STACK_ENV_FILE" ]]; then
  REMOTE_ENV_PREFIX="STACK_ENV_FILE='$REMOTE_STACK_ENV_FILE' $REMOTE_ENV_PREFIX"
fi

log "Local DB source: $LOCAL_DB_PATH"
log "Remote deploy root: $REMOTE_DEPLOY_ROOT"
log "Remote DB target: $REMOTE_DB_PATH"
if [[ "$SYNC_RAG_SNAPSHOT" == '1' ]]; then
  log "Local RAG snapshot source: $LOCAL_RAG_SNAPSHOT_PATH"
  log "Remote RAG snapshot target: $REMOTE_RAG_SNAPSHOT_PATH"
fi

ssh_cmd "mkdir -p '$(dirname "$REMOTE_DB_PATH")' '$REMOTE_BACKUP_DIR'"
scp_cmd "$LOCAL_DB_PATH" "$(remote_scp_target "$DB_TMP_PATH")"

if [[ "$SYNC_RAG_SNAPSHOT" == '1' ]]; then
  ssh_cmd "mkdir -p '$(dirname "$REMOTE_RAG_SNAPSHOT_PATH")'"
  scp_cmd "$LOCAL_RAG_SNAPSHOT_PATH" "$(remote_scp_target "$RAG_TMP_PATH")"
fi

REMOTE_COMMAND=$(cat <<EOF
set -euo pipefail
timestamp=\$(date '+%Y%m%d%H%M%S')
if [[ -f '$REMOTE_DB_PATH' ]]; then
  cp -p '$REMOTE_DB_PATH' '$REMOTE_BACKUP_DIR/my-resume.db.'"\$timestamp"
fi
mv '$DB_TMP_PATH' '$REMOTE_DB_PATH'
chmod 644 '$REMOTE_DB_PATH'
EOF
)

if [[ "$SYNC_RAG_SNAPSHOT" == '1' ]]; then
  REMOTE_COMMAND+=$'\n'
  REMOTE_COMMAND+=$(cat <<EOF
if [[ -f '$REMOTE_RAG_SNAPSHOT_PATH' ]]; then
  cp -p '$REMOTE_RAG_SNAPSHOT_PATH' '$REMOTE_BACKUP_DIR/rag-vector-snapshot.json.'"\$timestamp"
fi
mv '$RAG_TMP_PATH' '$REMOTE_RAG_SNAPSHOT_PATH'
chmod 644 '$REMOTE_RAG_SNAPSHOT_PATH'
EOF
)
fi

if [[ "$SKIP_RESTART" != '1' ]]; then
  REMOTE_COMMAND+=$'\n'
  REMOTE_COMMAND+=$(cat <<EOF
cd '$REMOTE_DEPLOY_ROOT'
$REMOTE_ENV_PREFIX
source './deploy/ecs/lib.sh'
load_stack_env
current_release=\$(readlink -f "\$DEPLOY_RUNTIME_ROOT/current")
compose_project=\$(resolve_compose_project_name)
if [[ -f "\$current_release/compose.prod.yml" && -f "\$current_release/.env" ]]; then
  sudo_cmd docker compose --project-name "\$compose_project" -f "\$current_release/compose.prod.yml" --env-file "\$current_release/.env" restart server
fi
EOF
)
fi

ssh_cmd "$REMOTE_COMMAND"

log "SQLite sync completed: $REMOTE_DB_PATH"
if [[ "$SYNC_RAG_SNAPSHOT" == '1' ]]; then
  log "RAG snapshot sync completed: $REMOTE_RAG_SNAPSHOT_PATH"
fi
if [[ "$SKIP_RESTART" == '1' ]]; then
  log "Remote server restart skipped"
else
  log "Remote server restarted"
fi
