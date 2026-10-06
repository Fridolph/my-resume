# shared/ — 跨域共享层

只有**被 2 个以上 feature 用到**的能力才放这里（避免过度封装）。

```
shared/
├── components/   # 通用 UI 组件（antd 封装、布局原语、通用交互组件）
├── hooks/        # 跨域可复用 hooks
└── lib/          # 基础设施：http client、storage、格式化、常量
```

## 规则

- 展示组件（`components/`）不含请求逻辑。
- `lib/` 是无 UI 的基础设施，可被 hooks / apis / components 使用。
- 判定标准：**「只在一个 feature 用」= 留 feature；「跨 feature 用」= 上移 shared**。
