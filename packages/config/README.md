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

## 当前阶段不做

- 不全面接入 ESLint 执行流程
- 不接入真实环境变量校验库
- 不修改现有根级 Vue 项目的编译链路
