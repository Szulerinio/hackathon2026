import Link from 'next/link'
import { ALERTS } from '../../lib/mock-data'
import { slugify } from '../../lib/data'

export default function AlertsPage() {
  const sorted = [...ALERTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-sub">AI-generated from contact notes · {ALERTS.length} active</div>
        </div>
        <span className="ai-badge">✦ AI</span>
      </div>

      {sorted.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>No alerts right now</div>
          <div style={{ fontSize: 12 }}>AI will generate alerts as you update contact notes</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(alert => (
            <div
              key={alert.id}
              className="panel"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, borderLeft: '3px solid var(--red)' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Link
                    href={`/contacts/${slugify(alert.contactName)}`}
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
                  >
                    {alert.contactName}
                  </Link>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{alert.createdAt}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {alert.reason}
                </div>
              </div>
              <button
                style={{
                  flexShrink: 0,
                  padding: '5px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {alert.actionLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
