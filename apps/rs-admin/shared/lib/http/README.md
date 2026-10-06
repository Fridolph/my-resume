# shared/lib/http — 数据层基座

## 约定

- **展示组件不发请求**：数据请求只写在 `features/<domain>/apis/`，再由 `features/<domain>/hooks/` 用 `alova` 的 `useRequest` 消费。
- **复用 `@my-resume/api-client`**：不重复造 method。工厂函数形如
  `createXxxMethod({ apiBaseUrl, accessToken }).send()`。
- **基地址单一来源**：`api-base.ts` 导出 `apiBaseUrl`（来自 `@config/env`）。
- **鉴权 token 单一来源**：`shared/lib/auth/token-storage.ts`。

## 数据链路示例

```
features/<domain>/apis/getXxx.ts     ← 调用 api-client 工厂，注入 apiBaseUrl + token
features/<domain>/hooks/useXxx.ts    ← alova useRequest 包装，暴露 data/loading/error
features/<domain>/components/*.tsx   ← 只消费 hook 结果，不发请求
```
