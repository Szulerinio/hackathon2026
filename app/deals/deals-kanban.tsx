'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { DealRow } from '../../lib/crm'
import { moveDealAction } from './actions'
import EditDealModal from './edit-deal-modal'

type Props = {
  deals: DealRow[]
  buyers: { slug: string; name: string }[]
  listings: { id: number; address: string }[]
}

const COLUMNS: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'viewing',     label: 'Viewing',     color: 'var(--blue)',  bg: 'var(--blue-bg)' },
  { key: 'offer',       label: 'Offer',       color: 'var(--amber)', bg: 'var(--amber-bg)' },
  { key: 'negotiation', label: 'Negotiation', color: 'var(--red)',   bg: 'var(--red-bg)' },
  { key: 'closed',      label: 'Closed',      color: 'var(--green)', bg: 'var(--green-bg)' },
]

function DealCard({
  deal,
  buyers,
  listings,
  isDragging = false,
}: {
  deal: DealRow
  buyers: Props['buyers']
  listings: Props['listings']
  isDragging?: boolean
}) {
  const router = useRouter()
  return (
    <div
      onClick={() => !isDragging && router.push(`/deals/${deal.id}`)}
      className="panel"
      style={{
        padding: '12px 14px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        display: 'flex', flexDirection: 'column', gap: 8,
        opacity: isDragging ? 0.95 : 1,
        boxShadow: isDragging ? 'var(--shadow-lg)' : undefined,
        transition: 'box-shadow 0.15s',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <Link
          href={`/contacts/${deal.buyerSlug}`}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.3 }}
        >
          {deal.buyerName}
        </Link>
        <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
          <EditDealModal deal={deal} buyers={buyers} listings={listings} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
        {deal.propertyAddress}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dim)' }}>
          {deal.value}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>
          {deal.lastActivityDate}
        </span>
      </div>
    </div>
  )
}

function DraggableCard({ deal, buyers, listings }: { deal: DealRow; buyers: Props['buyers']; listings: Props['listings'] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, cursor: 'grab' }}
    >
      <DealCard deal={deal} buyers={buyers} listings={listings} />
    </div>
  )
}

function DroppableColumn({
  col,
  deals,
  buyers,
  listings,
  isOver,
}: {
  col: (typeof COLUMNS)[0]
  deals: DealRow[]
  buyers: Props['buyers']
  listings: Props['listings']
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: col.key })
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 2px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: col.color }}>
          {col.label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, background: col.bg, color: col.color, padding: '1px 6px', borderRadius: 10 }}>
          {deals.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          minHeight: 80,
          borderRadius: 'var(--r)',
          padding: isOver ? '6px' : '0',
          background: isOver ? `color-mix(in srgb, ${col.color} 6%, transparent)` : 'transparent',
          border: isOver ? `1.5px dashed ${col.color}` : '1.5px dashed transparent',
          transition: 'all 0.15s',
        }}
      >
        {deals.map(deal => (
          <DraggableCard key={deal.id} deal={deal} buyers={buyers} listings={listings} />
        ))}
        {deals.length === 0 && !isOver && (
          <div style={{
            border: '1.5px dashed var(--border)', borderRadius: 'var(--r)',
            padding: '20px 14px', textAlign: 'center', fontSize: 11, color: 'var(--text3)',
          }}>
            No deals
          </div>
        )}
      </div>
    </div>
  )
}

export default function DealsKanban({ deals: initialDeals, buyers, listings }: Props) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const activeDeal = activeId != null ? deals.find(d => d.id === activeId) ?? null : null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as number)
  }

  function handleDragOver(e: { over: { id: string } | null }) {
    setOverId(e.over?.id ?? null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    setOverId(null)
    const id = e.active.id as number
    const newStatus = e.over?.id as string | undefined
    if (!newStatus) return

    const deal = deals.find(d => d.id === id)
    if (!deal || deal.status === newStatus) return

    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
    await moveDealAction(id, newStatus)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver as never} onDragEnd={handleDragEnd}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'start' }}>
        {COLUMNS.map(col => (
          <DroppableColumn
            key={col.key}
            col={col}
            deals={deals.filter(d => d.status === col.key)}
            buyers={buyers}
            listings={listings}
            isOver={overId === col.key}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <DealCard deal={activeDeal} buyers={buyers} listings={listings} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}
