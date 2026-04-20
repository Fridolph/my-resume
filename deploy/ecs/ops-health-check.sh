#!/usr/bin/env bash

set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/root/my-resume}"
STACK_ENV_FILE="${STACK_ENV_FILE:-${DEPLOY_ROOT}/.deploy-runtime/shared/config/stack.env.local}"
SKIP_PUBLIC_CHECK=0
WARN_DISK_PERCENT="${WARN_DISK_PERCENT:-85}"
CRITICAL_DISK_PERCENT="${CRITICAL_DISK_PERCENT:-92}"
WARN_MEM_AVAILABLE_MB="${WARN_MEM_AVAILABLE_MB:-300}"

WARNINGS=()
CRITICALS=()

usage() {
  cat <<'EOF'
Usage:
  ./deploy/ecs/ops-health-check.sh [options]

Options:
  --deploy-root <path>            部署根目录，默认 /root/my-resume
  --stack-env <path>              stack env 文件路径
  --skip-public-check             跳过公网域名检查
  --warn-disk-percent <num>       磁盘预警阈值，默认 85
  --critical-disk-percent <num>   磁盘严重阈值，默认 92
  --warn-mem-available-mb <num>   可用内存预警阈值（MB），默认 300
  -h, --help                      显示帮助
EOF
}

add_warning() {
  WARNINGS+=("$1")
}

add_critical() {
  CRITICALS+=("$1")
}

print_section() {
  printf '\n== %s ==\n' "$1"
}

http_check() {
  local label="$1"
  local url="$2"
  local result code duration

  result=$(curl -sS -o /dev/null --max-time 12 -w '%{http_code} %{time_total}' "$url" || true)
  code=$(printf '%s' "$result" | awk '{print $1}')
  duration=$(printf '%s' "$result" | awk '{print $2}')
  [[ -n "$code" ]] || code='000'
  [[ -n "$duration" ]] || duration='-'

  printf '%-18s %-55s code=%s time=%ss\n' "$label" "$url" "$code" "$duration"

  if [[ "$code" =~ ^[0-9]{3}$ ]] && (( code >= 200 && code < 400 )); then
    return 0
  fi

  if [[ "$code" == '000' ]] || ([[ "$code" =~ ^[0-9]{3}$ ]] && (( code >= 500 ))); then
    add_critical "${label} 检查失败（${code}）：${url}"
    return 1
  fi

  add_warning "${label} 返回非预期状态（${code}）：${url}"
  return 1
}

port_listening() {
  local port="$1"
  ss -lnt 2>/dev/null | awk 'NR>1 {print $4}' | grep -Eq ":${port}$"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --deploy-root)
      DEPLOY_ROOT="$2"
      shift 2
      ;;
    --stack-env)
      STACK_ENV_FILE="$2"
      shift 2
      ;;
    --skip-public-check)
      SKIP_PUBLIC_CHECK=1
      shift
      ;;
    --warn-disk-percent)
      WARN_DISK_PERCENT="$2"
      shift 2
      ;;
    --critical-disk-percent)
      CRITICAL_DISK_PERCENT="$2"
      shift 2
      ;;
    --warn-mem-available-mb)
      WARN_MEM_AVAILABLE_MB="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if (( WARN_DISK_PERCENT >= CRITICAL_DISK_PERCENT )); then
  echo "WARN_DISK_PERCENT must be less than CRITICAL_DISK_PERCENT" >&2
  exit 1
fi

if [[ -f "$STACK_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$STACK_ENV_FILE"
  set +a
fi

print_section '基础信息'
date
uptime
printf 'hostname: %s\n' "$(hostname)"
printf 'deploy_root: %s\n' "$DEPLOY_ROOT"
printf 'stack_env: %s (%s)\n' "$STACK_ENV_FILE" "$([[ -f "$STACK_ENV_FILE" ]] && echo found || echo missing)"

print_section '资源快照'
free -h
df -h /
df -ih /
printf 'loadavg: %s\n' "$(cat /proc/loadavg)"

mem_available_kb=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
mem_available_mb=$((mem_available_kb / 1024))
if (( mem_available_mb < WARN_MEM_AVAILABLE_MB )); then
  add_warning "可用内存 ${mem_available_mb}MB 低于阈值 ${WARN_MEM_AVAILABLE_MB}MB"
fi

disk_used_percent=$(df -P / | awk 'NR==2 {gsub("%", "", $5); print $5}')
if (( disk_used_percent >= CRITICAL_DISK_PERCENT )); then
  add_critical "根分区使用率 ${disk_used_percent}%（>=${CRITICAL_DISK_PERCENT}%）"
elif (( disk_used_percent >= WARN_DISK_PERCENT )); then
  add_warning "根分区使用率 ${disk_used_percent}%（>=${WARN_DISK_PERCENT}%）"
fi

print_section '系统服务'
for service_name in nginx docker; do
  service_state=$(systemctl is-active "$service_name" 2>/dev/null || true)
  printf '%-10s %s\n' "$service_name" "${service_state:-unknown}"
  if [[ "$service_state" != 'active' ]]; then
    add_critical "服务未处于 active：${service_name}"
  fi
done

print_section '容器状态'
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
  container_count=$(docker ps -q | wc -l | tr -d ' ')
  if (( container_count == 0 )); then
    add_warning '当前没有运行中的容器（若非发布窗口需排查）'
  fi
else
  add_critical '未找到 docker 命令'
fi

print_section '发布快照'
current_link="${DEPLOY_ROOT}/.deploy-runtime/current"
if [[ -L "$current_link" ]]; then
  printf 'current_release: %s\n' "$(readlink -f "$current_link")"
else
  add_warning "未发现 current 软链：${current_link}"
fi

if [[ -d "${DEPLOY_ROOT}/.deploy-runtime/release-snapshots" ]]; then
  ls -1 "${DEPLOY_ROOT}/.deploy-runtime/release-snapshots" | tail -n 10
fi

print_section '端口监听'
for port in 80 443 5577 5555 5566; do
  if port_listening "$port"; then
    printf 'port %-5s listening\n' "$port"
  else
    printf 'port %-5s not-listening\n' "$port"
    if [[ "$port" == '80' || "$port" == '443' ]]; then
      add_critical "端口未监听：${port}"
    else
      add_warning "应用端口未监听：${port}"
    fi
  fi
done

print_section '本机健康检查'
http_check 'server-local' 'http://127.0.0.1:5577/api' || true
http_check 'web-local' 'http://127.0.0.1:5555/' || true
http_check 'admin-local' 'http://127.0.0.1:5566/login' || true

if (( SKIP_PUBLIC_CHECK == 0 )); then
  print_section '公网健康检查'
  [[ -n "${RESUME_DOMAIN:-}" ]] && http_check 'resume-domain' "https://${RESUME_DOMAIN}" || add_warning '缺少 RESUME_DOMAIN，跳过公网检查'
  [[ -n "${ADMIN_DOMAIN:-}" ]] && http_check 'admin-domain' "https://${ADMIN_DOMAIN}/login" || add_warning '缺少 ADMIN_DOMAIN，跳过公网检查'
  [[ -n "${API_DOMAIN:-}" ]] && http_check 'api-domain' "https://${API_DOMAIN}/api" || add_warning '缺少 API_DOMAIN，跳过公网检查'
fi

print_section '巡检结论'
if (( ${#CRITICALS[@]} > 0 )); then
  echo 'CRITICAL:'
  for item in "${CRITICALS[@]}"; do
    printf '  - %s\n' "$item"
  done
fi

if (( ${#WARNINGS[@]} > 0 )); then
  echo 'WARN:'
  for item in "${WARNINGS[@]}"; do
    printf '  - %s\n' "$item"
  done
fi

if (( ${#CRITICALS[@]} == 0 && ${#WARNINGS[@]} == 0 )); then
  echo 'OK: 所有关键检查通过'
  exit 0
fi

if (( ${#CRITICALS[@]} > 0 )); then
  exit 2
fi

exit 1
