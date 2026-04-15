# GitHub Actions 连接 ECS 发布说明

本文档配合以下文件一起使用：

- `/Users/fri/Desktop/personal/my-resume/.github/workflows/deploy-ecs.yml:1`
- `/Users/fri/Desktop/personal/my-resume/deploy/ecs/README.md:1`
- `/Users/fri/Desktop/personal/my-resume/deploy/ecs/stack-env-checklist.md:1`

目标是让你在 **不把运行时业务密钥放进 GitHub** 的前提下，通过 GitHub Actions 手动触发 ECS 发布。

## 一、当前发布链路

当前工作流保持最小闭环，只做以下事情：

1. 手动输入待部署的 tag，默认 `v2.0.0`
2. 校验该 tag 在仓库中存在
3. 通过 SSH 登录 ECS
4. 在 ECS 上执行：

```bash
cd /opt/my-resume/repo
git fetch --tags --force
./deploy/ecs/release.sh <tag>
```

也就是说：

- GitHub Actions 只负责“远程触发”
- 真正的发布逻辑仍在服务器侧 `release.sh`
- 业务环境变量仍保留在 ECS 本地 `stack.env`

## 二、为什么这样设计

这套设计适合当前教程型 monorepo 的节奏：

- 不把 CI/CD 和业务配置耦合得过深
- 手工发布与自动发布共用同一套脚本
- 出问题时先能在 ECS 上直接复现
- 未来要切换到更完整的流水线时，不需要推翻 `deploy/ecs/*`

## 三、需要准备的 GitHub Secrets

进入：

`GitHub Repo -> Settings -> Secrets and variables -> Actions`

至少新增以下 4 个 Secrets：

### 1. `ECS_HOST`

- 含义：ECS 公网 IP 或域名
- 示例：`1.2.3.4`

### 2. `ECS_PORT`

- 含义：SSH 端口
- 默认：`22`
- 如果你服务器改过 SSH 端口，就填实际值

### 3. `ECS_USER`

- 含义：SSH 登录用户
- 常见值：`root`、`ubuntu`、`ecs-user`

### 4. `ECS_SSH_PRIVATE_KEY`

- 含义：GitHub Actions 用来登录 ECS 的私钥
- 建议使用单独的 deploy key，不要直接复用你本机常用私钥

## 四、推荐的 SSH Key 配置方式

### 1. 在本地生成一对新的 deploy key

```bash
ssh-keygen -t ed25519 -C "github-actions-ecs-deploy" -f ~/.ssh/my-resume-ecs-deploy
```

生成后你会得到：

- 私钥：`~/.ssh/my-resume-ecs-deploy`
- 公钥：`~/.ssh/my-resume-ecs-deploy.pub`

### 2. 把公钥放到 ECS

登录 ECS 后，把公钥追加到目标用户的：

```bash
~/.ssh/authorized_keys
```

例如：

```bash
cat ~/.ssh/my-resume-ecs-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. 把私钥放进 GitHub Secret

把私钥文件内容完整复制到：

- `ECS_SSH_PRIVATE_KEY`

注意：

- 要包含 `-----BEGIN OPENSSH PRIVATE KEY-----`
- 也要包含结尾行
- 不要多删空行

## 五、服务器侧前置条件

在启用 Actions 之前，建议先手工完成一次部署，确认服务器已经准备好：

### 1. ECS 上已有仓库目录

```bash
/opt/my-resume/repo
```

### 2. 已执行过 bootstrap

```bash
cd /opt/my-resume/repo
./deploy/ecs/bootstrap.sh
```

### 3. 已填写 `stack.env`

```bash
/opt/my-resume/shared/config/stack.env
```

### 4. 已手工成功跑过一次 release

```bash
./deploy/ecs/release.sh v2.0.0
```

这样做的目的，是把“SSH / 权限 / Docker / Nginx / Certbot / 域名”问题先在线下排干净。

## 六、如何手动触发工作流

进入：

`GitHub Repo -> Actions -> Deploy ECS -> Run workflow`

你会看到两个输入项：

- `deploy_tag`
- `deploy_root`

默认值：

- `deploy_tag=v2.0.0`
- `deploy_root=/opt/my-resume/repo`

一般情况下直接点运行即可。

## 七、首次触发建议顺序

建议按这个顺序来：

### 第一步：先在 ECS 手工验证

```bash
cd /opt/my-resume/repo
./deploy/ecs/release.sh v2.0.0
```

### 第二步：再用 Actions 触发同一 tag

确认：

- SSH 能连通
- 工作流能正常结束
- 远端不会因为幂等执行而出错

### 第三步：以后再切换为新 tag 发布

例如未来发布：

```text
v2.0.1
v2.1.0
```

## 八、常见问题排查

### 1. `ssh: Could not resolve hostname`

通常是：

- `ECS_HOST` 填错
- DNS 还没生效

### 2. `Permission denied (publickey)`

通常是：

- `ECS_SSH_PRIVATE_KEY` 内容不完整
- 公钥没加到服务器 `authorized_keys`
- `ECS_USER` 不对

### 3. `cd /opt/my-resume/repo: No such file or directory`

通常是：

- `deploy_root` 填错
- ECS 上仓库目录实际不在这里

### 4. `release.sh` 在服务器上失败

这时先不要反复点 Actions，优先直接 SSH 到 ECS，手工执行：

```bash
cd /opt/my-resume/repo
./deploy/ecs/release.sh v2.0.0
```

先拿到服务器本地完整日志，再修问题。

## 九、当前边界

本轮工作流仍保持最小化：

- 不自动写入服务器环境变量
- 不自动上传 `.env`
- 不自动生成 SSH key
- 不做蓝绿部署
- 不做多环境矩阵

先把“能稳定 SSH 触发同一套发布脚本”跑通，再继续演进到更复杂的 CI/CD。
