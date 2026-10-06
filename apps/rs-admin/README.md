# rs-admin 分层与职责边界

> 本文件定义 `apps/rs-admin` 的目录分层与依赖规则。
> 参考 `dao-monorepo-temp` 的分层思路，但用 Next.js App Router 落地。
> **这是硬约定**：新增代码必须落在对应层，跨边界复用必须上移到 `shared/`。

## 目录职责

```
apps/rs-admin/
├── app/            # 路由层（Next App Router）—— 只放 route / layout / page
│   ├── (auth)/     # 登录等无壳路由
│   └── (dashboard)/ # 后台壳路由
├── config/         # 配置驱动：导航、常量、环境变量读取、可选项定义
├── types/          # 全局类型（跨 feature 共用的领域类型）
├── utils/          # 纯函数工具（无副作用、无 React、无请求）
├── shared/         # 跨域共享层
│   ├── components/ # 通用 UI 组件（antd 封装、通用业务无关组件）
│   ├── hooks/      # 跨域可复用 hooks
│   └── lib/        # 基础设施：http client、storage、i18n/格式化等
└── features/       # 业务域（自治单元）
    └── <domain>/   # 每个域自成一包
        ├── components/  # 域内组件
        ├── hooks/       # 域内 hooks
        ├── apis/        # 域内数据请求
        ├── constants/   # 域内常量
        └── types/       # 域内类型
```

## 依赖规则（边界）

1. **app/ 只做路由编排**：`page.tsx` / `layout.tsx` 负责组装 `features/*` 的容器组件，不写业务逻辑。
2. **feature 自治**：`features/<domain>` 内可自由使用 `shared/`、`utils/`、`config/`、`types/`。
3. **禁止 feature 之间直接互引**：`features/a` 不得 import `features/b`。若两块需要共享，抽到 `shared/`。
4. **禁止深路径跨层 import**：一律用别名（`@shared/*`、`@features/*`、`@config/*`），
   不允许 `../../../` 式相对路径跨目录。
5. **数据请求只在 `apis/` 与 `hooks/`**：展示组件（`components/`）不得直接发请求。
6. **样式单一来源**：组件内建样式用 antd token；Tailwind 只做布局与微调；**禁止 `!important`**。

## 目标依赖方向（单向）

```
app  →  features  →  shared  →  utils / config / types
                 ↘  shared  ↘
```

上层可依赖下层，下层不得反向依赖上层。

## 别名

| 别名 | 指向 |
|---|---|
| `@/*` | `./*` |
| `@app/*` | `./app/*` |
| `@config/*` | `./config/*` |
| `@shared/*` | `./shared/*` |
| `@features/*` | `./features/*` |
