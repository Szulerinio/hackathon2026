import Link from 'next/link'
import { getAiLogs } from '../../../lib/ai/logging'

function statusClass(status: string): string {
  if (status === 'success') return 's-green'
  if (status === 'error') return 's-red'
  return 's-blue'
}

function formatPayload(raw: string): string {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export default async function AiLogsPage() {
  const logs = await getAiLogs(150)

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">AI logs</div>
          <div className="page-sub">
            Audit trail for alert extraction · {logs.length} recent entries
          </div>
        </div>
        <span className="ai-badge">✦ AI</span>
      </div>

      {logs.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>No AI logs yet</div>
          <div style={{ fontSize: 12 }}>
            Log an activity on a contact or run{' '}
            <code style={{ fontSize: 11 }}>pnpm ai:extract-alerts</code> to generate entries.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map((log) => (
            <details key={log.id} className="panel" style={{ padding: 0 }}>
              <summary
                style={{
                  listStyle: 'none',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace', flexShrink: 0, paddingTop: 2 }}>
                  #{log.id}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className={`s-pill ${statusClass(log.status)}`}>{log.status}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{log.operation}</span>
                    {log.source && (
                      <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>
                        {log.source}
                      </span>
                    )}
                    {log.contactSlug && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{log.contactSlug}</span>
                    )}
                  </div>
                  {log.summary && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{log.summary}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>{log.createdAt}</span>
                    {log.model && <span>{log.model}</span>}
                    {log.durationMs != null && <span>{log.durationMs}ms</span>}
                  </div>
                </div>
              </summary>
              <div
                style={{
                  padding: '0 14px 14px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {log.contactSlug && (
                  <Link href={`/contacts/${log.contactSlug}`} style={{ fontSize: 11, color: 'var(--text2)' }}>
                    → View contact
                  </Link>
                )}
                {log.error && (
                  <div style={{ fontSize: 11, color: 'var(--red)', lineHeight: 1.5 }}>{log.error}</div>
                )}
                {log.inputPreview && (
                  <div>
                    <div className="section-label" style={{ marginBottom: 4 }}>Input</div>
                    <pre
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'var(--text2)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        background: 'var(--surface2)',
                        padding: 10,
                        borderRadius: 'var(--r-sm)',
                        maxHeight: 160,
                        overflow: 'auto',
                      }}
                    >
                      {log.inputPreview}
                    </pre>
                  </div>
                )}
                {log.payload && (
                  <div>
                    <div className="section-label" style={{ marginBottom: 4 }}>Payload</div>
                    <pre
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: 'var(--text2)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        background: 'var(--surface2)',
                        padding: 10,
                        borderRadius: 'var(--r-sm)',
                        maxHeight: 280,
                        overflow: 'auto',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {formatPayload(log.payload)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  )
}
