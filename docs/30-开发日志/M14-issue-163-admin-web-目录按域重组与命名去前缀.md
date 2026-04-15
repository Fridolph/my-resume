# M14 / issue-163 / admin-web-目录按域重组与命名去前缀

- Issue：`[Refactor] M14 / issue-admin-web-目录按域重组与命名去前缀`
- 里程碑：`M14 编辑体验与亮点表达重构`
- 分支：`fys-dev/feat-m14-issue-163-165-component-refactor`
- 日期：`2026-04-07`

## 背景

`apps/admin/components` 与 `apps/web/components` 在多轮功能迭代后，逐渐形成“平铺文件 + 文件名前缀区分域”的状态。随着测试与组件数量增加，路径辨识度和维护成本都开始上升。

## 本次目标

- 将 `admin / web` 组件目录按业务域重组
- 域目录内去掉重复前缀，保留显式 import
- 让测试文件随域目录一起下沉，减少“实现和测试分离”的维护成本

## 非目标

- 不修改服务端接口与共享 schema
- 不借本次重构顺手做 UI 改版
- 不引入 barrel / index 导出层

## TDD / 测试设计

- 先迁移组件与测试路径，再修复 import
- 通过 `admin` 与 `web` 的现有测试回归确认迁移没有破坏行为
- 重点验证 dashboard、resume、publish、公开简历页等入口还能正常渲染

## 实际改动

- `apps/admin/components` 重组为 `admin/`、`ai/`、`auth/`、`publish/`、`resume/`、`shared/`
- `apps/web/components` 重组为 `site/`、`profile/`、`ai-talk/`、`published-resume/`
- 将旧文件名中的 `admin-`、`public-site-` 等重复前缀去掉，改为域目录表达语义
- 对应测试迁移到域内 `__tests__`，同步更新页面与组件的 import 路径

## Review 记录

- 本次重构只处理目录与命名，不扩展功能范围，符合当前 issue 边界
- 目录表达从“前缀命名”转为“域目录 + 简短文件名”，后续更适合继续拆组件
- 显式 import 保留了迁移期的可读性，也降低了 barrel 引起的路径歧义

## 自测结果

- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin typecheck` ✅
- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/web typecheck` ✅

## 遇到的问题

- 旧测试路径大量引用原平铺文件，需要逐个修正 import
- 个别 mock 仍指向旧路径，迁移后需要一并校准

## 可沉淀为教程/博客的点

- React / Next monorepo 中如何做“按业务域重组”的渐进式目录治理
- 为什么组件目录重构时不建议同时引入 barrel

## 后续待办

- 继续把超长组件中的展示块与 helper 往域内拆开
- 观察后续 issue 中是否需要补充更细的子目录层级
