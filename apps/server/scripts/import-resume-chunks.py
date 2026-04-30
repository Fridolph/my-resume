#!/usr/bin/env python3
"""
从 Milvus 导出的 JSONL 导入到 SQLite rag_documents 和 rag_chunks 表。

使用方式:
  pnpm --filter @my-resume/server rag:import:resume
  pnpm --filter @my-resume/server rag:import:resume --file .data/resume_profile_chunks.jsonl

每行 JSON 结构:
  { id, section, subsection_key, subsection_title, entity_type,
    content, vector, tags, source_id, locale, chunk_index, chunk_count }
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DB_PATH = REPO_ROOT / ".data" / "my-resume.db"
DEFAULT_INPUT = REPO_ROOT / ".data" / "resume_profile_chunks.jsonl"


def resolve_input_path() -> Path:
    for i, arg in enumerate(sys.argv):
        if arg == "--file" and i + 1 < len(sys.argv):
            return Path(sys.argv[i + 1])
    return DEFAULT_INPUT


def compute_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()


def main():
    input_path = resolve_input_path()

    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading: {input_path}")
    chunks = []

    with open(input_path, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                chunks.append(record)
            except json.JSONDecodeError as e:
                print(f"WARNING: skip invalid JSON at line {line_num}: {e}")

    print(f"Parsed {len(chunks)} chunks")

    if not chunks:
        print("No chunks to import.", file=sys.stderr)
        sys.exit(1)

    # 构建文档记录
    source_id = str(chunks[0].get("source_id", "fuyinsheng-resume-zh"))
    locale = str(chunks[0].get("locale", "zh"))
    doc_id = compute_hash(f"resume_core:published:{source_id}:{locale}")
    now = int(time.time() * 1000)
    content_hash = compute_hash(
        "".join(str(c.get("content", "")) for c in chunks)
    )

    db_path = str(DB_PATH)
    print(f"Target DB: {db_path}")

    if not DB_PATH.exists():
        print(f"DB file does not exist yet: {db_path}")
        sys.exit(1)

    import sqlite3
    db = sqlite3.connect(db_path)

    # 插入或替换文档记录
    db.execute(
        """
        INSERT OR REPLACE INTO rag_documents
          (id, source_type, source_scope, source_id, source_version,
           locale, title, content_hash, metadata_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            doc_id,
            "resume_core",
            "published",
            source_id,
            f"milvus-import:{time.strftime('%Y-%m-%d')}",
            locale,
            "付寅生简历核心数据",
            content_hash,
            json.dumps({
                "importedFrom": "milvus",
                "totalChunks": len(chunks),
                "importedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }, ensure_ascii=False),
            now,
            now,
        ),
    )

    # 清除旧 chunk
    db.execute("DELETE FROM rag_chunks WHERE document_id = ?", (doc_id,))

    # 按顺序插入新 chunk
    inserted = 0
    for i, chunk in enumerate(chunks):
        try:
            db.execute(
                """
                INSERT INTO rag_chunks
                  (id, document_id, chunk_index, section, content,
                   content_hash, embedding_json, metadata_json,
                   created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(chunk.get("id", "")),
                    doc_id,
                    i,
                    str(chunk.get("section", chunk.get("subsection_key", ""))),
                    str(chunk.get("content", "")),
                    compute_hash(str(chunk.get("content", ""))),
                    json.dumps(chunk.get("vector", [])),
                    json.dumps({
                        "source_id": str(chunk.get("source_id", "")),
                        "locale": str(chunk.get("locale", "zh")),
                        "subsection_key": str(chunk.get("subsection_key", "")),
                        "subsection_title": str(chunk.get("subsection_title", "")),
                        "entity_type": str(chunk.get("entity_type", "")),
                        "tags": chunk.get("tags", []),
                    }, ensure_ascii=False),
                    now,
                    now,
                ),
            )
            inserted += 1
        except Exception as e:
            print(f"  skip chunk {i} ({str(chunk.get('id', ''))[:40]}): {e}")

    db.commit()
    db.close()

    print(f"Inserted {inserted}/{len(chunks)} chunks")
    print("Done.")


if __name__ == "__main__":
    main()
