import Link from 'next/link'
import { getAlertFeed } from '../../lib/crm'

export default async function AlertsPage() {
  const alerts = await getAlertFeed()

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-sub">AI-generated from contact notes · {alerts.length} active</div>
        </div>
        <span className="ai-badge">✦ AI</span>
      </div>

      {alerts.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>No alerts right now</div>
          <div style={{ fontSize: 12 }}>AI will generate alerts as you update contact notes</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="panel"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, borderLeft: '3px solid var(--red)' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Link
                    href={`/contacts/${alert.contactSlug}`}
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
                  >
                    {alert.contactName}
                  </Link>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Created {alert.createdAt}
                  </span>
                  {alert.dueDate ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)' }}>
                      Due {alert.dueDate}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>No due date</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {alert.reason}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {alert.contactEmail && (
                  <a
                    href={`mailto:${alert.contactEmail}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',

                      padding: '5px 12px',
                      background: '#fff',
                      border: '1px solid var(--border2)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Email
                  </a>
                )}
                {alert.contactPhone && (
                  <a
                    href={`tel:${alert.contactPhone}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',

                      padding: '5px 12px',
                      background: '#fff',
                      border: '1px solid var(--border2)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Call
                  </a>
                )}
                {!alert.contactEmail && !alert.contactPhone && (
                  <span
                    style={{
                      padding: '5px 12px',
                      fontSize: 12,
                      color: 'var(--text3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    No contact info
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
