'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ActivityEvent } from '../../../lib/crm'
import {
  createActivityAction,
  updateActivityAction,
  deleteActivityAction,
  type ActivityActionResult,
} from './activity-actions'
import { formatDate, getCrmToday } from '../../../lib/decay'

const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'other'] as const

const TYPE_ICONS: Record<string, string> = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  note: '📝',
  other: '📌',
}

function todayValue(): string {
  return formatDate(getCrmToday())
}

const initialState: ActivityActionResult | null = null

function ActivityModal({
  slug,
  activity,
  onClose,
}: {
  slug: string
  activity?: ActivityEvent
  onClose: () => void
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const action = activity
    ? (_prev: ActivityActionResult | null, fd: FormData) =>
        updateActivityAction(slug, activity.id, fd)
    : (_prev: ActivityActionResult | null, fd: FormData) =>
        createActivityAction(slug, fd)

  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state?.ok) {
      router.refresh()
      onClose()
    }
  }, [state])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {activity ? 'Edit activity' : 'Log activity'}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ fontSize: 11 }}>✕</button>
        </div>

        <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Type *</label>
              <select
                name="type"
                defaultValue={activity?.type ?? 'call'}
                style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
              >
                {ACTIVITY_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date *</label>
              <input
                name="date"
                type="date"
                defaultValue={activity?.date ?? todayValue()}
                style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</label>
            <textarea
              name="notes"
              defaultValue={activity?.notes ?? ''}
              placeholder="What was discussed, next steps…"
              rows={3}
              style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {state && !state.ok && (
            <p style={{ fontSize: 11, color: 'var(--red)', margin: 0 }} role="alert">{state.error}</p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={pending} style={{ fontSize: 12 }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={pending} style={{ fontSize: 12 }}>
              {pending ? 'Saving…' : activity ? 'Save' : 'Log activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ActivityRow({
  activity,
  slug,
}: {
  activity: ActivityEvent
  slug: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteActivityAction(slug, activity.id)
    router.refresh()
  }

  return (
    <>
      {editing && (
        <ActivityModal slug={slug} activity={activity} onClose={() => setEditing(false)} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, lineHeight: 1, paddingTop: 1, flexShrink: 0 }}>
          {TYPE_ICONS[activity.type] ?? '📌'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{activity.type}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{activity.date}</span>
          </div>
          {activity.notes && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3, lineHeight: 1.55 }}>{activity.notes}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setEditing(true)}
            style={{ fontSize: 11, padding: '2px 8px' }}
          >
            Edit
          </button>
          {confirmDelete ? (
            <>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ fontSize: 11, padding: '2px 8px', background: 'var(--red-bg, rgba(239,68,68,0.12))', color: 'var(--red)', border: '1px solid transparent', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}
              >
                {deleting ? '…' : 'Confirm'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 11, padding: '2px 8px', color: 'var(--text3)' }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default function ActivityLog({
  activities,
  slug,
}: {
  activities: ActivityEvent[]
  slug: string
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {modalOpen && (
        <ActivityModal slug={slug} onClose={() => setModalOpen(false)} />
      )}
      <div className="panel fade-up" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activities.length > 0 ? 4 : 0 }}>
          <div className="section-label" style={{ margin: 0 }}>
            Activity log
            {activities.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text3)', fontWeight: 500, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>
                {activities.length}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setModalOpen(true)}
            style={{ fontSize: 11, padding: '2px 8px' }}
          >
            + Log activity
          </button>
        </div>

        {activities.map(a => (
          <ActivityRow key={a.id} activity={a} slug={slug} />
        ))}

        {activities.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text3)', paddingTop: 6 }}>
            No activity logged yet. Record calls, emails, and meetings here.
          </div>
        )}
      </div>
    </>
  )
}
