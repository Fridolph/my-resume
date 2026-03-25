# M6 测试、CI/CD 与部署上线教程大纲

## 一、为什么 `M6` 很重要

- 前五个里程碑解决的是“功能能不能跑”
- `M6` 解决的是“能不能持续稳定演进”
- 对开源教程项目来说，测试、CI、部署闭环决定了项目是否真正可复用

## 二、先收敛本地质量门禁

- 为什么先做 `issue-20`
- 如何把 `server / web / admin` 的测试入口统一到根目录
- 为什么 `typecheck / build / test` 要有固定命令

## 三、再把本地门禁搬到 GitHub

- 为什么旧版动态脚本检测不适合当前 monorepo
- `GitHub Actions` 最小 CI 应该跑什么
- 为什么 `CI` 是第二道门，而不是替代本地自测

## 四、如何理解当前部署拓扑

- 为什么 `web / admin` 放 `Vercel`
- 为什么 `server` 放云服务器
- 为什么继续坚持“唯一业务后端是 NestJS”

## 五、三端部署的最小路径

- `apps/web` 的环境变量与部署设置
- `apps/admin` 的环境变量与部署设置
- `apps/server` 的构建、启动、守护与反向代理

## 六、上线后要验证什么

- 公开简历读取
- 管理端登录
- `viewer / admin` 角色边界
- `markdown / pdf` 下载
- AI 相关环境变量是否配置正确

## 七、这一阶段故意没有做什么

- 不做复杂发布流水线
- 不做 IaC
- 不做完整监控体系
- 不做多环境矩阵

## 八、后续可继续拓展的话题

- 分支保护与 required checks
- Preview / Production 环境拆分
- HTTPS 与 CDN
- PM2 到 systemd 的迁移
- 从最小部署走向真正可运维
