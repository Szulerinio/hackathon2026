'use client'

import { useState } from 'react'
import type { Contact } from '../../../lib/crm'

const AV_COLORS = ['av-0','av-1','av-2','av-3','av-4','av-5']
function avatarClass(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AV_COLORS[h % AV_COLORS.length]
}

export default function TabbedLayout({ contact }: { contact: Contact }) {
  const [tab, setTab] = useState<'overview' | 'background' | 'followups'>('overview')

  return (
    <div className="panel fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="contact-header">
        <div className={`contact-avatar ${avatarClass(contact.id)}`}>{contact.initials}</div>
        <div>
          <div className="contact-name">{contact.name}</div>
          <div className="contact-role">{contact.relationship.split(',')[0]}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`s-pill ${contact.decayTier === 'urgent' ? 's-red' : contact.decayTier === 'warning' ? 's-amber' : contact.decayTier === 'watch' ? 's-blue' : 's-green'}`}>
            {contact.decayTier}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{contact.daysSince}d since contact</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {(['overview', 'background', 'followups'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--text)' : 'var(--text3)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--text)' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {t === 'followups' ? 'Follow-ups' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="section-label">Last interaction</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
              {contact.lastInteractionSummary || 'No interaction recorded'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{contact.lastInteractionDate}</div>
          </div>
          <div>
            <div className="section-label">Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {contact.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
          <div>
            <div className="section-label">How we met</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{contact.source}</div>
          </div>
        </div>
      )}

      {tab === 'background' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="section-label">Context & background</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{contact.context}</div>
          </div>
          <div>
            <div className="section-label">Source</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{contact.source}</div>
          </div>
        </div>
      )}

      {tab === 'followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div className="section-label">Notes & open items</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {contact.notes || 'No open items noted.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
