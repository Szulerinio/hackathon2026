import Link from 'next/link'
import { getContacts } from '../lib/data'
import ContactsList from './contacts-list'

const DEALS = [
  { initials: 'BM', avClass: 'av-1', name: 'Sienkiewicza — family home sale', person: 'Beata Mazur · widow · seller + future buyer', status: 'listing', statusClass: 's-amber', value: '850K', id: 'beata-mazur' },
  { initials: 'MK', avClass: 'av-0', name: 'University district — investment apt', person: 'Marek Kowalski · investor · 2nd purchase', status: 'viewing', statusClass: 's-blue', value: '420K', id: 'marek-kowalski' },
  { initials: 'C', avClass: 'av-4', name: 'Luxury 200sqm — via Anna K', person: 'CEO Laboratorium Kosmetyczne · referral', status: 'hot lead', statusClass: 's-red', value: '1.2M+', id: null },
  { initials: 'SK', avClass: 'av-2', name: 'Airbnb 2-bed city center', person: 'Szymon Kaczmarek · car dealer · BNI', status: 'cold lead', statusClass: 's-dim', value: '380K', id: 'szymon-kaczmarek' },
  { initials: 'ES', avClass: 'av-3', name: 'Commercial office 80sqm Kazimierz', person: 'Ewa Szymańska · notary · wants to own', status: 'scouting', statusClass: 's-dim', value: '600K', id: 'ewa-szymanska' },
]

const PROMISES = [
  { text: 'Send 3 luxury options for CEO apartment search', who: 'Anna Krajewska', age: 33, color: 'var(--red)', id: 'anna-krajewska' },
  { text: 'Research non-resident property tax for Stefan', who: 'Stefan Fischer', age: 55, color: 'var(--red)', id: 'stefan-fischer' },
  { text: 'Check land registry — parking spot Sienkiewicza', who: 'Beata Mazur', age: 40, color: 'var(--red)', id: 'beata-mazur' },
  { text: 'Introduce Agnieszka to Dorota Kamińska', who: 'Agnieszka Lis', age: 52, color: 'var(--amber)', id: 'agnieszka-lis' },
  { text: 'Look into Giżycko lakeside plot — summer house', who: 'Tomasz Barański', age: 39, color: 'var(--amber)', id: 'tomasz-baranskii' },
  { text: 'Owe dinner — emergency Sunday staging prep', who: 'Agnieszka Lis', age: 52, color: 'var(--text3)', id: 'agnieszka-lis' },
  { text: 'Chase invoice — Kowalczyk job from February', who: 'Damian Krawczyk', age: 28, color: 'var(--amber)', id: 'damian-krawczyk' },
]

export default async function DashboardPage() {
  const contacts = getContacts()
  const urgent = contacts.filter(c => c.decayTier === 'urgent')
  const warning = contacts.filter(c => c.decayTier === 'warning')
  const attention = urgent.length + warning.length

  const alerts = contacts
    .filter(c => c.decayTier === 'urgent' || c.decayTier === 'warning')
    .sort((a, b) => b.decayScore - a.decayScore)
    .slice(0, 4)

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Good morning, Rafał</div>
          <div className="page-sub">{contacts.length} contacts · {attention} need attention · 9 open promises</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-dim)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', padding: '4px 10px', borderRadius: '20px' }}>
          <div className="pulse" />
          AI insights active
        </div>
      </div>

      {/* Today strip */}
      <div className="today-strip">
        <div className="today-label">Today</div>
        <div className="today-items">
          <div className="today-item">🎂 <strong>Bartek&apos;s 40th surprise party</strong> — don&apos;t mention to Karolina</div>
          <div className="today-item">⚠ <strong>Anna K</strong> waiting for CEO apartment options since last week</div>
          <div className="today-item">📞 <strong>Marek K</strong> viewings today — bring rental yield comparison</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-row">
        <div className="mcard">
          <div className="mlabel">Total contacts</div>
          <div className="mval">{contacts.length}</div>
          <div className="msub">50 people across all categories</div>
        </div>
        <div className="mcard alert-card">
          <div className="mlabel">Need attention</div>
          <div className="mval red">{attention}</div>
          <div className="msub dn">{urgent.length} urgent · {warning.length} warning</div>
        </div>
        <div className="mcard">
          <div className="mlabel">Pipeline value</div>
          <div className="mval green">2.65M</div>
          <div className="msub up">5 active deals</div>
        </div>
        <div className="mcard warn-card">
          <div className="mlabel">Open promises</div>
          <div className="mval amber">9</div>
          <div className="msub dn">3 overdue 30+ days</div>
        </div>
      </div>

      {/* Mid grid */}
      <div className="mid-grid">

        {/* Contacts panel */}
        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-title">Contacts</div>
            <Link href="/contacts" className="panel-link">View all →</Link>
          </div>
          <ContactsList contacts={contacts} />
        </div>

        {/* AI Alerts */}
        <div className="panel" style={{ borderColor: 'rgba(204,43,43,0.2)' }}>
          <div className="panel-hdr" style={{ marginBottom: '8px' }}>
            <div className="panel-title">Relationship alerts</div>
            <span className="ai-badge">✦ AI</span>
          </div>
          {alerts.map(c => (
            <div key={c.id} className="alert-item">
              <div className="alert-top">
                <div className="av av-1" style={{ width: 22, height: 22, fontSize: 9 }}>{c.initials}</div>
                <span className="aname">{c.name}</span>
                <span className={`adays ${c.decayTier === 'urgent' ? 'red' : 'amber'}`}>{c.daysSince}d</span>
              </div>
              <div className="areason">{c.lastInteractionSummary.slice(0, 100)}{c.lastInteractionSummary.length > 100 ? '…' : ''}</div>
              <Link href={`/contacts/${c.id}`} className="aaction">→ View contact</Link>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="bottom-grid">

        {/* Deals */}
        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-title">Active deals</div>
            <span className="panel-link">Full pipeline →</span>
          </div>
          {DEALS.map((d, i) => (
            <div key={i} className="deal-row">
              <div className={`av ${d.avClass}`}>{d.initials}</div>
              <div className="deal-info">
                <div className="deal-name">{d.name}</div>
                <div className="deal-person">{d.person}</div>
              </div>
              <span className={`s-pill ${d.statusClass}`}>{d.status}</span>
              <div className="deal-val">{d.value}</div>
            </div>
          ))}
        </div>

        {/* Promises */}
        <div className="panel">
          <div className="panel-hdr">
            <div className="panel-title">
              Open promises
              <span className="ai-badge">✦ AI extracted</span>
            </div>
          </div>
          {PROMISES.map((p, i) => (
            <div key={i} className="promise-row">
              <div className="pdot" style={{ background: p.color }} />
              <div style={{ flex: 1 }}>
                <div className="ptext">{p.text}</div>
                <div className="pwho">→ {p.who}</div>
              </div>
              <div className="page-age" style={{ color: p.color }}>{p.age}d</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
