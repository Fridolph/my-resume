import { dirname, join, resolve } from 'path';

import { resolveRepoRoot } from '../../../config/repo-root';

export interface RagRuntimePaths {
  sourcePath: string;
  blogDirectoryPath: string;
  indexPath: string;
}

export function resolveRagRuntimePaths(env: NodeJS.ProcessEnv): RagRuntimePaths {
  const repoRoot = resolveRepoRoot(__dirname);

  return {
    sourcePath:
      env.RAG_RESUME_SOURCE_PATH?.trim() ||
      join(repoRoot, 'apps/server/data/rag/resume.zh.yaml'),
    blogDirectoryPath:
      env.RAG_BLOG_DIRECTORY_PATH?.trim() || join(repoRoot, 'blog'),
    indexPath:
      env.RAG_INDEX_PATH?.trim() ||
      join(repoRoot, 'apps/server/storage/rag/resume-index.json'),
  };
}

export function resolveRagIndexDirectory(indexPath: string): string {
  return resolve(dirname(indexPath));
}
