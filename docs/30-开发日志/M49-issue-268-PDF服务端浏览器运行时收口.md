# M49 / issue-268 PDF 服务端浏览器运行时收口

> 日期：2026-08-10
> Issue：#268 `M49.2 / PDF 版式收紧与服务端真实下载`

## 背景

`review-resume` 已切换为调用发布态 PDF 接口下载真实文件，但本地接口返回 `500`：Puppeteer 无法在默认缓存目录找到匹配的 Chrome。运行时镜像也只安装了 CJK 字体，未提供 Chromium，部署后同样无法保证 PDF 导出可用。

## 本次目标

- 为 Puppeteer 提供明确、可配置的浏览器可执行文件路径。
- 在 server 运行时镜像内安装 Chromium，并固定容器路径。
- 验证本地 API 能返回真实 A4 PDF，且版式保持 4 页以内。

## 非目标

- 不更换 PDF 引擎，不引入新的 npm 依赖。
- 不改简历发布数据、公开 API 请求参数或 Admin 下载入口。

## 实际改动

- `ResumePdfExportService` 读取可选环境变量 `PUPPETEER_EXECUTABLE_PATH`，仅在配置存在时传给 Puppeteer；未配置时仍保留 Puppeteer 默认解析行为。
- 本地 `.env.development.local` 指向已安装的 Google Chrome；`.env.example` 增加同一变量说明，避免将本机路径写死进业务代码。
- `apps/server/Dockerfile` 在运行时基础镜像中安装 `chromium`，并设置 `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`。
- 服务端 PDF 模板与预览页继续对齐：头像、社交链接、可点击网站链接、18px `#333` section 标题与自然分页规则。

## 排查记录

接口错误明确指出 Puppeteer 需要的 Chrome 不在 `/Users/fri/.cache/puppeteer`。原因是当前依赖安装未下载 Puppeteer 自带浏览器，而运行环境又没有显式可执行文件路径。

修复后使用本机 Google Chrome 重新请求：

```text
GET /api/resume/published/export/pdf?locale=zh
200 application/pdf
Content-Disposition: attachment; filename="standard-resume-zh.pdf"
```

生成文件为 A4、4 页、约 856 KB；使用 `pdftoppm` 渲染四页 PNG 检查，标题、头像、链接区、经历/项目分页均正常，没有旧版整段 section 推页造成的大块空白。

## Review

- 改动范围限定在 `#268`：PDF 浏览器运行时、PDF 模板对齐、测试、环境说明和开发日志。
- 未增加 npm 依赖；`chromium` 仅作为 server Docker 运行时系统依赖。
- 镜像体积会因 Chromium 增加；这是服务端稳定生成 PDF 的必要运行时成本。
- 生产发布必须重新构建 server 镜像，旧镜像不会自动获得 Chromium。

## 验证

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/resume/__tests__/resume-pdf-export.service.spec.ts src/modules/resume/__tests__/resume.controller.spec.ts`
  - 通过：2 个文件、7 个测试。
- `pnpm --filter @my-resume/server typecheck`
  - 通过。
- 本地 API 实测：导出接口返回有效 PDF，`pdfinfo` 确认为 A4、4 页。
- `pdftoppm` 视觉检查：4 页 PNG 均可正常渲染。
- `docker build --target runtime-base -f apps/server/Dockerfile .`
  - 通过：当前 `node:22-slim` 可安装 `chromium`，确认可执行文件路径为 `/usr/bin/chromium`。
- `git diff --check`
  - 通过。

## 后续切入点

- 可在后续发布任务中记录 server 镜像因 Chromium 增加的体积，并评估是否需要独立的 PDF worker。
- 可增加 CI 镜像冒烟测试，在容器中请求一次 PDF 接口，提前发现浏览器运行时缺失。
