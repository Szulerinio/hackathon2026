'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Task } from '../../../lib/crm'
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  type TaskActionResult,
} from './task-actions'
import { getCrmToday, formatDate } from '../../../lib/decay'

function todayValue(): string {
  return formatDate(getCrmToday())
}

const initialState: TaskActionResult | null = null

function isOverdue(dueDate: string, done: boolean): boolean {
  if (done || !dueDate) return false
  return dueDate < todayValue()
}

function TaskModal({
  slug,
  task,
  onClose,
}: {
  slug: string
  task?: Task
  onClose: () => void
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const action = task
    ? (_prev: TaskActionResult | null, fd: FormData) => updateTaskAction(slug, task.id, fd)
    : (_prev: TaskActionResult | null, fd: FormData) => createTaskAction(slug, fd)

  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state?.ok) {
      router.refresh()
      onClose()
    }
  }, [state])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 400 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {task ? 'Edit task' : 'Add task'}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ fontSize: 11 }}>✕</button>
        </div>

        <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Task *</label>
            <input
              name="title"
              type="text"
              defaultValue={task?.title ?? ''}
              placeholder="e.g. Call about listing offer"
              autoFocus
              style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Due date *</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate ?? todayValue()}
              style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</label>
            <textarea
              name="notes"
              defaultValue={task?.notes ?? ''}
              placeholder="Optional context…"
              rows={2}
              style={{ padding: '6px 8px', fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {state && !state.ok && (
            <p style={{ fontSize: 11, color: 'var(--red)', margin: 0 }} role="alert">{state.error}</p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={pending} style={{ fontSize: 12 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={pending} style={{ fontSize: 12 }}>
              {pending ? 'Saving…' : task ? 'Save' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskRow({ task, slug }: { task: Task; slug: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const overdue = isOverdue(task.dueDate, task.done)

  async function handleToggle() {
    setToggling(true)
    await toggleTaskAction(slug, task.id, !task.done)
    router.refresh()
    setToggling(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteTaskAction(slug, task.id)
    router.refresh()
  }

  return (
    <>
      {editing && <TaskModal slug={slug} task={task} onClose={() => setEditing(false)} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', opacity: task.done ? 0.5 : 1 }}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          style={{
            width: 16, height: 16, borderRadius: 4, border: `2px solid ${task.done ? 'var(--accent-dim)' : overdue ? 'var(--red)' : 'var(--border)'}`,
            background: task.done ? 'var(--accent-dim)' : 'transparent',
            cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white',
          }}
        >
          {task.done ? '✓' : ''}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
            {task.dueDate && (
              <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
                {overdue ? '⚠ ' : ''}{task.dueDate}
              </span>
            )}
          </div>
          {task.notes && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3, lineHeight: 1.55 }}>{task.notes}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button type="button" className="btn-ghost" onClick={() => setEditing(true)} style={{ fontSize: 11, padding: '2px 8px' }}>Edit</button>
          {confirmDelete ? (
            <>
              <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, padding: '2px 8px' }}>Cancel</button>
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
            <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(true)} style={{ fontSize: 11, padding: '2px 8px', color: 'var(--text3)' }}>Remove</button>
          )}
        </div>
      </div>
    </>
  )
}

export default function Tasks({ tasks, slug }: { tasks: Task[]; slug: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <>
      {modalOpen && <TaskModal slug={slug} onClose={() => setModalOpen(false)} />}
      <div className="panel fade-up" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open.length > 0 ? 4 : 0 }}>
          <div className="section-label" style={{ margin: 0 }}>
            Tasks
            {open.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text3)', fontWeight: 500, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>
                {open.length}
              </span>
            )}
          </div>
          <button type="button" className="btn-ghost" onClick={() => setModalOpen(true)} style={{ fontSize: 11, padding: '2px 8px' }}>
            + Add task
          </button>
        </div>

        {open.map((t) => <TaskRow key={t.id} task={t} slug={slug} />)}

        {open.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text3)', paddingTop: 6 }}>
            No open tasks. Add one to schedule a follow-up.
          </div>
        )}

        {done.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0 }}
          >
            {showDone ? `Hide ${done.length} completed` : `Show ${done.length} completed`}
          </button>
        )}

        {showDone && done.map((t) => <TaskRow key={t.id} task={t} slug={slug} />)}
      </div>
    </>
  )
}
