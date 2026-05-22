'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HouseholdMember } from '../../../lib/crm'
import {
  addMemberAction,
  updateMemberAction,
  deleteMemberAction,
  type MemberActionResult,
} from './member-actions'

const initialState: MemberActionResult | null = null

function MemberForm({
  slug,
  member,
  onCancel,
}: {
  slug: string
  member?: HouseholdMember
  onCancel: () => void
}) {
  const router = useRouter()
  const action = member
    ? (_prev: MemberActionResult | null, fd: FormData) => updateMemberAction(slug, member.id, fd)
    : (_prev: MemberActionResult | null, fd: FormData) => addMemberAction(slug, fd)

  const [state, formAction, pending] = useActionState(action, initialState)

  if (state?.ok) {
    router.refresh()
    onCancel()
  }

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Name *</label>
          <input
            name="name"
            defaultValue={member?.name ?? ''}
            placeholder="Full name"
            autoFocus
            style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Role</label>
          <input
            name="role"
            defaultValue={member?.role ?? ''}
            placeholder="e.g. spouse, partner"
            style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phone</label>
          <input
            name="phone"
            defaultValue={member?.phone ?? ''}
            placeholder="+48 …"
            style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email</label>
          <input
            name="email"
            defaultValue={member?.email ?? ''}
            placeholder="email@example.com"
            style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Note</label>
        <textarea
          name="note"
          defaultValue={member?.note ?? ''}
          placeholder="Context, preferences, decision-making role…"
          rows={2}
          style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
      {state && !state.ok && (
        <p style={{ fontSize: 11, color: 'var(--red)', margin: 0 }} role="alert">{state.error}</p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={pending} style={{ fontSize: 12 }}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={pending} style={{ fontSize: 12 }}>
          {pending ? 'Saving…' : member ? 'Save' : 'Add member'}
        </button>
      </div>
    </form>
  )
}

function MemberRow({
  member,
  slug,
}: {
  member: HouseholdMember
  slug: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteMemberAction(slug, member.id)
    router.refresh()
  }

  if (editing) {
    return <MemberForm slug={slug} member={member} onCancel={() => setEditing(false)} />
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{member.name}</span>
          {member.role && (
            <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
              {member.role}
            </span>
          )}
        </div>
        {(member.phone || member.email) && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 10 }}>
            {member.phone && <span>{member.phone}</span>}
            {member.email && <span>{member.email}</span>}
          </div>
        )}
        {member.note && (
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>{member.note}</div>
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
              {deleting ? '…' : 'Confirm remove'}
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
  )
}

export default function HouseholdMembers({
  members,
  slug,
}: {
  members: HouseholdMember[]
  slug: string
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="panel fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: members.length > 0 || adding ? 10 : 0 }}>
        <div className="section-label" style={{ margin: 0 }}>
          Household members
          {members.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text3)', fontWeight: 500, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>
              {members.length}
            </span>
          )}
        </div>
        {!adding && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setAdding(true)}
            style={{ fontSize: 11, padding: '2px 8px' }}
          >
            + Add member
          </button>
        )}
      </div>

      {members.map(m => (
        <MemberRow key={m.id} member={m} slug={slug} />
      ))}

      {adding && (
        <MemberForm slug={slug} onCancel={() => setAdding(false)} />
      )}

      {members.length === 0 && !adding && (
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          No household members. Add spouse, partner, or family members who are part of this contact.
        </div>
      )}
    </div>
  )
}
