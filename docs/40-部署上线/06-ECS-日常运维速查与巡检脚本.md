# ECS 日常运维速查与巡检脚本

适用场景：`my-resume` 部署在 ECS（2核2G、40G 系统盘）后的日常维护。

配套脚本：`deploy/ecs/ops-health-check.sh`

## 1. 每天做什么

### 每日巡检

```bash
cd /root/my-resume
./deploy/ecs/ops-health-check.sh
```

### 发布后巡检

```bash
cd /root/my-resume
./deploy/ecs/ops-health-check.sh
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
readlink -f /root/my-resume/.deploy-runtime/current
```

## 2. 巡检脚本会检查什么

- 时间、uptime、hostname
- 内存/磁盘/inode/load
- `nginx`、`docker` 服务状态
- 容器状态（名称、镜像、健康）
- 当前发布快照（`current` 软链）
- 端口监听（80/443/5577/5555/5566）
- 本机健康检查（127.0.0.1）
- 公网健康检查（`RESUME_DOMAIN` / `ADMIN_DOMAIN` / `API_DOMAIN`）

## 3. 返回码说明（可用于自动化）

- `0`：全部通过
- `1`：有告警（WARN）
- `2`：有严重问题（CRITICAL）

## 4. 常用参数

```bash
# 内网排查（跳过公网域名）
./deploy/ecs/ops-health-check.sh --skip-public-check

# 自定义阈值
./deploy/ecs/ops-health-check.sh \
  --warn-disk-percent 85 \
  --critical-disk-percent 92 \
  --warn-mem-available-mb 300

# 非默认部署目录
./deploy/ecs/ops-health-check.sh --deploy-root /root/my-resume
```

## 5. 阈值建议（2核2G）

- 磁盘使用率 `>=85%` 预警，`>=92%` 严重
- `MemAvailable < 300MB` 预警
- `nginx/docker` 非 `active` 视为严重

## 6. 常见故障处理

### 6.1 发布后容器未启动

```bash
cd /root/my-resume
STACK_ENV_FILE=./.deploy-runtime/shared/config/stack.env.local \
DEPLOY_ROOT=/root/my-resume \
./deploy/ecs/release.sh vX.Y.Z
```

### 6.2 端口冲突（5577/5555/5566）

当前发布流程已自动执行：

- `deploy/ecs/pre-release-port-cleanup.sh`

必要时可手工执行：

```bash
cd /root/my-resume
./deploy/ecs/pre-release-port-cleanup.sh --stack-env ./.deploy-runtime/shared/config/stack.env.local
```

### 6.3 磁盘快满

```bash
docker system df
docker container prune -f
docker image prune -af
docker builder prune -af
df -h /
```

## 7. 建议习惯

- 每天固定跑一次巡检
- 每次发布后必须跑一次巡检并截图
- 每周清一次 docker builder 缓存（发布频繁时）
- 连续两次出现 `CRITICAL`，先稳态再继续新功能开发
