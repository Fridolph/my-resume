# packages/ui

共享 UI 包目录。

## 当前已落地

- `src/display.css`：共享展示层 tokens 与最小基础样式
- 为 `web / admin` 统一字体、卡片半径、阴影、弱文案和 eyebrow 等基础表达
- `src/theme.tsx`：共享 `light / dark` 主题 provider、持久化与文档根节点同步能力

## 未来职责

- 提供 `web` 与 `admin` 共享组件
- 统一主题与基础样式约定

## 当前阶段不做

- 不做完整组件库
- 不引入 UI 库封装
- 不实现多模板主题系统
