# profile 模块

公开站概览页模块。

## 职责

- `overview-shell.tsx`：概览页内容编排
- `__tests__/`：概览页模块测试
- `types/`：预留模块本地类型目录

## 边界

- 复用 `published-resume` 提供的公开简历数据与文案工具
- 不在本模块重复定义公开简历 DTO
