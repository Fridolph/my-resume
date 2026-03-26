import { existsSync } from 'fs';
import { dirname, resolve } from 'path';

function isFilesystemRoot(pathname: string): boolean {
  return dirname(pathname) === pathname;
}

export function resolveRepoRoot(fromPath = __dirname): string {
  let currentPath = resolve(fromPath);

  while (true) {
    if (
      existsSync(resolve(currentPath, 'pnpm-workspace.yaml')) ||
      existsSync(resolve(currentPath, '.git'))
    ) {
      return currentPath;
    }

    if (isFilesystemRoot(currentPath)) {
      break;
    }

    currentPath = dirname(currentPath);
  }

  return resolve(fromPath, '../../../../');
}
