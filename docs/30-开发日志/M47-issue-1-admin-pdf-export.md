# M47 Issue 1: Admin PDF 导出下载（Puppeteer HTML→PDF）

## 背景

Admin 端已支持 Markdown 导出下载。PDF 导出曾用 pdfkit，后因字体/样式问题改为 Puppeteer HTML→PDF（M23），但目前 Admin 端没有 PDF 下载按钮。

## 目标

Admin 简历编辑页增加 PDF 导出下载功能——服务端渲染 HTML 模板 → Puppeteer 生成 PDF → 下载。

## 非目标

- 不做 Markdown→PDF（MD 导出已有）
- 不在公开站提供 PDF 下载（公开站只有 MD 下载）
- 不做多模板切换（先用固定模板）

## 改动范围

```
apps/server/src/modules/resume/
  └── application/services/
      └── resume-pdf-export.service.ts  修改：从 Puppeteer → 生成 HTML→PDF
  └── resume.controller.ts              新增：GET /api/resume/pdf/export
  └── templates/
      └── pdf-resume.html                新增：HTML 简历模板（带中文字体）

apps/admin/app/[locale]/dashboard/publish/_publish/
  └── components/export-entry-panel.tsx  修改：新增"下载 PDF"按钮
  └── publish-shell.tsx                  修改：接入 PDF 下载 API

apps/server/package.json                 确认 puppeteer 版本可用
```

## 技术路线

```ts
// Server：GET /api/resume/pdf/export
// 1. 读取已发布简历数据
// 2. 填充 HTML 模板（内联 CSS + 中文字体 base64）
// 3. Puppeteer launch → setContent → pdf()
// 4. 返回 application/pdf stream
```

优于 pdfkit 的地方：
- 内联字体 base64 解决中文乱码
- HTML/CSS 排版能力远强于 pdfkit 的画布模式
- 和 M23 Puppeteer 改造一致

## 验收标准

- [ ] Admin 端点击"下载 PDF"→ 浏览器下载 .pdf 文件
- [ ] PDF 中文正常显示（无乱码/无 tofu）
- [ ] PDF 排版与 web 简历一致（两栏/项目卡片/技能图表）
- [ ] 文件大小 < 2MB

## 测试计划

- 手工测试：Admin → 发布 → 下载 PDF → 打开检查
- 边界测试：过长的项目描述不会溢出、无图片时正常

---
