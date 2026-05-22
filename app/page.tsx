import Link from 'next/link'
import { getAlertFeed, getContacts, getDeals, getListings } from '../lib/crm'

export default async function DashboardPage() {
  const [contacts, listings, deals, alerts] = await Promise.all([
    getContacts(),
    getListings(),
    getDeals(),
    getAlertFeed(),
  ])

  const activeListings = listings.filter(l => l.status === 'active').length
  const activeDeals = deals.filter(d => ['viewing', 'offer', 'negotiation'].includes(d.status)).length
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
          <div className="today-item">⚠ <strong>Anna K</strong> waiting for CEO apartment options since last week</div>
          <div className="today-item">📞 <strong>Marek K</strong> viewings today — bring rental yield comparison</div>
          <div className="today-item">📄 <strong>Piotr Z</strong> flagged Paweł Adamczyk&apos;s Credit Agricole case needs a workaround</div>
        </div>
      </div>

      <div className="metrics-row">
        <div className="mcard">
          <div className="mlabel">Total contacts</div>
          <div className="mval">{contacts.length}</div>
          <div className="msub">people across your network</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Active listings</div>
          <div className="mval green">{activeListings}</div>
          <div className="msub up">{listings.length} total properties</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Active deals</div>
          <div className="mval" style={{ color: 'var(--accent-dim)' }}>{activeDeals}</div>
          <div className="msub">{deals.length} total deals</div>
        </div>
        <div className="mcard alert-card">
          <div className="mlabel">Alerts</div>
          <div className="mval red">{alerts.length}</div>
          <div className="msub dn">AI-generated from notes</div>
        </div>
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
              <span className="adays red">{alert.createdAt}</span>
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
