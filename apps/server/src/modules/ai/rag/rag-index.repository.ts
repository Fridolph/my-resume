import { Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { resolveRagIndexDirectory, resolveRagRuntimePaths } from './rag-paths'
import { RagIndexFile } from './rag.types'

@Injectable()
export class RagIndexRepository {
  getPaths() {
    return resolveRagRuntimePaths(process.env)
  }

  hasIndex(): boolean {
    return existsSync(this.getPaths().indexPath)
  }

  readIndex(): RagIndexFile | null {
    if (!this.hasIndex()) {
      return null
    }

    const content = readFileSync(this.getPaths().indexPath, 'utf8')

    return JSON.parse(content) as RagIndexFile
  }

  writeIndex(index: RagIndexFile): void {
    const { indexPath } = this.getPaths()

    mkdirSync(resolveRagIndexDirectory(indexPath), { recursive: true })
    writeFileSync(indexPath, JSON.stringify(index, null, 2))
  }
}
