'use client';

type ExportEntryPanelProps = {
  apiBaseUrl: string;
  locale: 'zh' | 'en';
  role: 'admin' | 'viewer';
};

function buildExportUrl(
  apiBaseUrl: string,
  format: 'markdown' | 'pdf',
  locale: 'zh' | 'en',
): string {
  return `${apiBaseUrl.replace(/\/$/, '')}/resume/published/export/${format}?locale=${locale}`;
}

export function ExportEntryPanel({
  apiBaseUrl,
  locale,
  role,
}: ExportEntryPanelProps) {
  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">导出下载</p>
        <h2>后台下载入口</h2>
        <p className="muted">
          当前后台下载入口仅导出已发布版本，草稿仍以后台编辑流为准。
        </p>
      </div>

      <div className="toolbar-group">
        <a href={buildExportUrl(apiBaseUrl, 'markdown', locale)}>
          下载 Markdown
        </a>
        <a href={buildExportUrl(apiBaseUrl, 'pdf', locale)}>下载 PDF</a>
      </div>

      <p className="muted">
        {role === 'viewer'
          ? 'viewer 只能读取已发布导出结果，不能触发新的生成动作。'
          : 'admin 可下载已发布结果，并继续在后台推进发布与 AI 流程。'}
      </p>
    </section>
  );
}
