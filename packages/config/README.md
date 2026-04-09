# packages/config

共享工程配置包占位目录。

## 未来职责

- 统一 `tsconfig`
- 统一 `eslint` 等工程配置
- 为多应用提供基础约束
- 逐步沉淀环境变量约束入口

## 当前阶段已提供

- `tsconfig.base.json`：共享 TypeScript 基础配置占位
- `eslint.base.cjs`：共享 ESLint 基础配置占位
- `env/README.md`：共享环境变量约定说明占位
- 根级 `OXC` 配置：`.oxlintrc.json` 与 `.oxfmtrc.json`

## OXC 配置约定

- `oxlint` 与 `oxfmt` 当前统一放在仓库根目录配置
- 原因是 CLI 与编辑器都优先按根目录自动发现，避免多包执行时额外透传 `-c`
- `packages/config` 继续承担共享 `tsconfig` / `eslint` 等工程配置角色，不强行承接 OXC 主配置

## 当前阶段不做

- 不全面接入 ESLint 执行流程
- 不接入真实环境变量校验库
- 不修改现有根级 Vue 项目的编译链路
