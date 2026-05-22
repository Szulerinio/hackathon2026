'use client'

import { useState } from 'react'
import type { DealRow } from '../../lib/crm'
import DealRowComponent from './deal-row'
import DealsKanban from './deals-kanban'

type Props = {
  deals: DealRow[]
  buyers: { slug: string; name: string }[]
  listings: { id: number; address: string }[]
}

type View = 'kanban' | 'table'

export default function DealsView({ deals, buyers, listings }: Props) {
  const [view, setView] = useState<View>('kanban')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setView('kanban')}
          style={{
            padding: '5px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: '6px 0 0 6px',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            background: view === 'kanban' ? 'var(--accent)' : 'var(--surface)',
            color: view === 'kanban' ? '#000' : 'var(--text2)',
            transition: 'all 0.15s',
          }}
        >
          ⊞ Board
        </button>
        <button
          type="button"
          onClick={() => setView('table')}
          style={{
            padding: '5px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: '0 6px 6px 0',
            border: '1px solid var(--border)',
            borderLeft: 'none',
            cursor: 'pointer',
            background: view === 'table' ? 'var(--accent)' : 'var(--surface)',
            color: view === 'table' ? '#000' : 'var(--text2)',
            transition: 'all 0.15s',
          }}
        >
          ≡ List
        </button>
      </div>

      {view === 'kanban' ? (
        <DealsKanban deals={deals} buyers={buyers} listings={listings} />
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 1fr 110px 100px 48px',
              gap: 8,
              padding: '9px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface2)',
            }}
          >
            {['Lead', 'Property', 'Price', 'Status', 'Last activity', ''].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)' }}>
                {h}
              </span>
            ))}
          </div>
          {deals.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              No deals yet
            </div>
          ) : (
            deals.map((deal, i) => (
              <DealRowComponent
                key={deal.id}
                deal={deal}
                buyers={buyers}
                listings={listings}
                isLast={i === deals.length - 1}
              />
            ))
          )}
        </div>
      )}
    </>
  )
}
