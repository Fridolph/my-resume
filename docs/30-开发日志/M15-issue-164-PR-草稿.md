# PR 草稿：M15 / issue-164 RAG 索引过期判断与源变更感知

## Summary

- 为 RAG 索引文件补充 `sourceHash / knowledgeHash` 元数据
- 在 `rebuildIndex()` 中写入当前简历源与博客知识目录的内容 hash
- 在 `status` 中返回 `stale` 以及当前 / 索引 hash 对照信息
- 补充 service 单测与 RAG e2e，覆盖源变更后的 stale 判断链路

## Why

- 当前简历或博客知识源发生变化后，系统还不能直接判断已有索引是否已经过期
- 仅靠“手动记忆是否重建过”不适合教学、调试和后续 Agent 接棒
- `status` 需要从“能看见索引摘要”继续推进到“能解释为什么该重建”

## Validation

- `pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/rag.service.spec.ts`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-rag.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`

## Notes

- 本 PR 只做 stale 判断，不做自动重建
- 本 PR 只补 API / service 层状态感知，不扩展 admin UI
- 后续如需继续推进，可在此基础上再拆：
  - stale → rebuild 工作流
  - 管理端状态展示
  - 更通用的 source manifest / index manifest 设计

## Issue

- closes #164
