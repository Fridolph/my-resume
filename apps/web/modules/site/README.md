# site 模块

公开站共享站点壳模块。

## 职责

- `header.tsx`：顶部导航、主题切换、语言切换与导出入口
- `header.module.css`：站点头部样式
- `__tests__/`：预留站点壳测试目录
- `types/`：预留模块本地类型目录

## 边界

- 只维护公开站共享 chrome
- 不承载某个业务页面专属 section 逻辑
