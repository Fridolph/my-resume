# review-resume 页面 — HTML 简历预览 + PDF 下载

> 关联模块：`apps/web/app/[locale]/review-resume/`
> 参考项目：`greensketch-basic` — `invoice.vue` + `useHtml2Pdf.ts`
> 状态：🔧 开发中

---

## issue-01 review-resume 页面搭建 + HTML→PDF 下载

### 背景

当前 PDF 导出通过服务端 Puppeteer 渲染 HTML 字符串，需要字体文件、不支持图片链接等。参考 `greensketch-basic` 项目方案：客户端直接将页面 DOM 通过 `html2pdf.js` 转为 PDF，天然支持图片、链接、布局。

### 目标

```
用户打开 /zh/review-resume（仅直接 URL 访问，不公开入口）
  → 页面渲染完整简历 HTML（A4 风格布局）
  → 点击"下载 PDF"按钮
  → html2pdf.js 截取页面 DOM → 生成 PDF → 浏览器下载
```

### 非目标

- 不替换现有服务端 PDF 导出（`resume-pdf-export.service.ts`），两条链路并存
- 不添加公开导航入口
- 不支持打印以外的模版切换（后续里程碑）

---

### 子任务

#### 1.1 安装依赖

```bash
pnpm add html2pdf.js --filter @my-resume/web
```

#### 1.2 创建 `useResumePdfExport` composable

- 封装 `html2pdf.js` 调用
- 导出前等待页内图片加载完成
- A4 尺寸（210mm × 297mm），0 边距
- 文件名：`简历_FYS_{locale}.pdf`

```typescript
// apps/web/app/_shared/resume/use-resume-pdf-export.ts
export function useResumePdfExport() {
  async function exportPdf(element: HTMLElement, fileName: string) { ... }
  return { exportPdf }
}
```

#### 1.3 创建 `review-resume` 页面

- 路由：`apps/web/app/[locale]/review-resume/page.tsx`
- 数据：`GET /api/resume/published`（复用现有接口）
- 布局：A4 宽度（794px），白色背景，打印友好样式
- 页面内容：个人信息 + 核心竞争力 + 教育 + 技能 + 工作经历 + 项目 + 兴趣 + 致谢
- 顶部工具栏（打印时隐藏）：
  - locale 切换（zh/en）
  - **下载 PDF 按钮**
  - 加载状态 / 空状态处理

#### 1.4 处理 SSR/图片加载

- 页面设 `'use client'`（纯客户端渲染，html2pdf 需要 DOM API）
- 导出 PDF 前调用 `waitForImages(element)` 确保图片加载完成

---

### 改动范围

| 层 | 文件 | 改动 |
|----|------|------|
| web | `package.json` | + `html2pdf.js` |
| web | `_shared/resume/use-resume-pdf-export.ts` | 新建 composable |
| web | `[locale]/review-resume/page.tsx` | 新建页面（含 toolbar + PDF 按钮） |
| web | `[locale]/review-pdf/` | 🔴 删除旧页面（功能被 review-resume 替代） |

---

### 验收标准

- [ ] 直接访问 `/zh/review-resume` 能看到完整简历 HTML 页面
- [ ] 点击"下载 PDF"按钮生成 A4 尺寸 PDF 文件
- [ ] PDF 内容与页面渲染一致（含中文、布局、间距）
- [ ] locale 参数切换中英文（`/zh/review-resume` vs `/en/review-resume`）
- [ ] 打印时工具栏自动隐藏
- [ ] 图片（如有）在 PDF 中完整显示
- [ ] build 通过
