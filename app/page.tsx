import Link from 'next/link'
import {
  getAlertFeed,
  getContacts,
  getDeals,
  getListings,
  toTodayStripItems,
} from '../lib/crm'

export default async function DashboardPage() {
  const [contacts, listings, deals, alerts] = await Promise.all([
    getContacts(),
    getListings(),
    getDeals(),
    getAlertFeed(),
  ])

  const activeListings = listings.filter(l => l.status === 'active').length
  const activeDeals = deals.filter(d => ['viewing', 'offer', 'negotiation'].includes(d.status)).length
  const todayItems = toTodayStripItems(alerts)
  const topAlerts = alerts.slice(0, 4)

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

      <div className="panel" style={{ borderColor: 'rgba(204,43,43,0.2)' }}>
        <div className="panel-hdr" style={{ marginBottom: 8 }}>
          <div className="panel-title">Recent alerts</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ai-badge">✦ AI</span>
            <Link href="/alerts" className="panel-link">View all →</Link>
          </div>
        </div>
        {topAlerts.map(alert => (
          <div key={alert.id} className="alert-item">
            <div className="alert-top">
              <span className="aname">{alert.contactName}</span>
              <span className="adays red">{alert.dueDate ? `Due ${alert.dueDate}` : alert.createdAt}</span>
            </div>
            <div className="areason">{alert.reason.slice(0, 110)}{alert.reason.length > 110 ? '…' : ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Link href={`/contacts/${alert.contactSlug}`} className="aaction">→ View contact</Link>
              <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>
                {alert.actionLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
