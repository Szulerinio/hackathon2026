import Link from 'next/link'
import {
  getAlertFeed,
  getContacts,
  getDeals,
  getListings,
  getMyTasksFeed,
  toTodayStripItems,
} from '../lib/crm'

export default async function DashboardPage() {
  const [contacts, listings, deals, alerts, myTasks] = await Promise.all([
    getContacts(),
    getListings(),
    getDeals(),
    getAlertFeed(),
    getMyTasksFeed(),
  ])

  const activeListings = listings.filter(l => l.status === 'active').length
  const activeDeals = deals.filter(d => ['viewing', 'offer', 'negotiation'].includes(d.status)).length
  const todayItems = toTodayStripItems(alerts)
  const topAlerts = alerts.slice(0, 4)
  const topTasks = myTasks.slice(0, 4)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Good morning, Rafał</div>
          <div className="page-sub">{contacts.length} contacts · {activeDeals} active deals · {alerts.length} alerts</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-dim)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '4px 10px', borderRadius: '20px' }}>
          <div className="pulse" />
          AI insights active
        </div>
      </div>

      <div className="today-strip">
        <div className="today-label">Today</div>
        <div className="today-items">
          {todayItems.length === 0 ? (
            <div className="today-item" style={{ color: 'var(--text3)' }}>No urgent items — you&apos;re caught up</div>
          ) : (
            todayItems.map(item => (
              <div key={item.id} className="today-item">
                {item.icon}{' '}
                <Link href={`/contacts/${item.contactSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <strong>{item.shortName}</strong>
                </Link>{' '}
                {item.summary}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="metrics-row">
        <Link href="/contacts" className="mcard" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="mlabel">Total contacts</div>
          <div className="mval">{contacts.length}</div>
          <div className="msub">people across your network</div>
        </Link>
        <Link href="/listings?filter=active" className="mcard green-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="mlabel">Active listings</div>
          <div className="mval green">{activeListings}</div>
          <div className="msub up">{listings.length} total properties</div>
        </Link>
        <Link href="/deals?filter=active" className="mcard accent-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="mlabel">Active deals</div>
          <div className="mval" style={{ color: 'var(--accent-dim)' }}>{activeDeals}</div>
          <div className="msub">{deals.length} total deals</div>
        </Link>
        <Link href="/alerts" className="mcard alert-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div className="mlabel">Alerts</div>
          <div className="mval red">{alerts.length}</div>
          <div className="msub dn">AI-generated from notes</div>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <div className="panel" style={{ flex: 1, borderColor: 'rgba(33,85,212,0.2)', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-hdr" style={{ marginBottom: 8 }}>
            <div className="panel-title">My Tasks</div>
          </div>
          {topTasks.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>No tasks yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {topTasks.map(task => {
                const isOverdue = task.dueDate && task.dueDate < today
                const isToday = task.dueDate === today
                const rowBg = isOverdue ? 'var(--red-bg)' : isToday ? 'rgba(234,112,0,0.10)' : undefined
                const dateColor = isOverdue ? 'var(--red)' : isToday ? '#EA7000' : 'var(--text3)'
                const dateLabel = isOverdue ? `Overdue · ${task.dueDate}` : isToday ? `Today · ${task.dueDate}` : task.dueDate ? `Due ${task.dueDate}` : 'No due date'
                return (
                  <Link key={task.id} href={`/contacts/${task.contactSlug}`} style={{ display: 'flex', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                    <div className="alert-item" style={{ flex: 1, cursor: 'pointer', background: rowBg, borderRadius: 6, padding: rowBg ? '10px 8px' : undefined, margin: rowBg ? '2px -8px' : undefined }}>
                      <div className="alert-top">
                        <span className="aname">{task.contactName}</span>
                        <span className="adays" style={{ color: dateColor, fontWeight: isOverdue || isToday ? 600 : 500 }}>
                          {dateLabel}
                        </span>
                      </div>
                      <div className="areason">{task.title.slice(0, 110)}{task.title.length > 110 ? '…' : ''}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="panel" style={{ flex: 1, borderColor: 'rgba(204,43,43,0.2)', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-hdr" style={{ marginBottom: 8 }}>
            <div className="panel-title">Smart Alerts</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ai-badge">✦ AI</span>
              <Link href="/alerts" className="panel-link">View all →</Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {topAlerts.map(alert => (
              <div key={alert.id} className="alert-item" style={{ flex: 1 }}>
                <div className="alert-top">
                  <span className="aname">{alert.contactName}</span>
                  <span className="adays" style={{ color: 'var(--text3)', fontWeight: 500 }}>
                    Created {alert.createdAt}
                    {alert.dueDate ? (
                      <span style={{ color: 'var(--red)', fontWeight: 600, marginLeft: 6 }}>
                        · Due {alert.dueDate}
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="areason">{alert.reason.slice(0, 110)}{alert.reason.length > 110 ? '…' : ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Link href={`/contacts/${alert.contactSlug}`} className="aaction">→ View contact</Link>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {alert.contactEmail && (
                      <a
                        href={`mailto:${alert.contactEmail}`}
                        style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', background: '#fff', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '2px 8px', textDecoration: 'none' }}
                      >
                        Email
                      </a>
                    )}
                    {alert.contactPhone && (
                      <a
                        href={`tel:${alert.contactPhone}`}
                        style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', background: '#fff', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '2px 8px', textDecoration: 'none' }}
                      >
                        Call
                      </a>
                    )}
                    {!alert.contactEmail && !alert.contactPhone && (
                      <span style={{ fontSize: 11, color: 'var(--text3)', padding: '2px 8px' }}>No contact info</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
