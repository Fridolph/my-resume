# M46 Issue 1: PDF 导入增强 — OCR 支持

## 背景

当前 `file-extraction.service` 用 `pdf-parse` 提取 PDF 文本。但**图片型 PDF**（扫描件/拍照件）无法提取文字——pdf-parse 对其返回空字符串。

## 目标

增加 Tesseract.js OCR 支持，覆盖扫描件 PDF 场景。

## 非目标

- 不做 AI 视觉模型 OCR（如 GPT-4V）
- 不做复杂版面分析（表格/多栏）
- 不改变现有文本 PDF 的处理路径（pdf-parse → OCR 仅在空文本时触发）

## 改动范围

```
apps/server/package.json               + tesseract.js 依赖
apps/server/src/modules/ai/
  └── file-extraction.service.ts        修改：空文本时 → OCR 回退
  └── ocr/
      └── ocr.service.ts                新增：Tesseract 封装
```

## 技术路线

```ts
// 1. pdf-parse 提取文本
// 2. 文本为空 → 转图片 (pdf-to-image)
// 3. Tesseract OCR 识别中文/英文
// 4. 返回 OCR 文本
```

## 验收标准

- [ ] 上传纯图片 PDF → 返回 OCR 识别文本
- [ ] 上传文本 PDF → 正常提取（pdf-parse 路径不变）
- [ ] 中英文混排 PDF 可识别
- [ ] OCR 延迟可控（< 30s 对于 5 页内 PDF）

## 测试计划

- 准备中英文扫描件 PDF 样本
- 对比 OCR 输出 vs 原始文本准确率

---
