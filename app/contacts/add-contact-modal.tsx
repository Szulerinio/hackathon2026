'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { createContactAction, type CreateContactResult } from './actions'
import { formatDate, getCrmToday } from '../../lib/decay'

const initialState: CreateContactResult | null = null

function todayInputValue(): string {
  return formatDate(getCrmToday())
}

export default function AddContactModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    async (_prev: CreateContactResult | null, formData: FormData) =>
      createContactAction(formData),
    initialState,
  )

  useEffect(() => {
    if (state?.ok) {
      setOpen(false)
      formRef.current?.reset()
      router.push(`/contacts/${state.slug}`)
      router.refresh()
    }
  }, [state, router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen(true)}
      >
        Add contact
      </button>

      {open && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-labelledby="add-contact-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="add-contact-title" className="modal-title">
                Add contact
              </h2>
              <button
                type="button"
                className="btn-ghost btn-icon"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <form ref={formRef} action={formAction} className="modal-form">
              <div className="form-row">
                <label className="form-label" htmlFor="contact-name">
                  Name <span className="form-required">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  className="form-input"
                  required
                  minLength={2}
                  autoFocus
                />
              </div>

              <div className="form-row form-row-2">
                <div>
                  <label className="form-label" htmlFor="contact-relationship">
                    Relationship
                  </label>
                  <input
                    id="contact-relationship"
                    name="relationship"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="contact-source">
                    Source
                  </label>
                  <input
                    id="contact-source"
                    name="source"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row form-row-2">
                <div>
                  <label className="form-label" htmlFor="contact-tags">
                    Tags
                  </label>
                  <input
                    id="contact-tags"
                    name="tags"
                    className="form-input"
                    placeholder="active client, warm lead"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="contact-role">
                    Role
                  </label>
                  <select
                    id="contact-role"
                    name="participantRole"
                    className="form-input"
                    defaultValue=""
                  >
                    <option value="">None</option>
                    <option value="seller">Seller</option>
                    <option value="buyer">Buyer</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="form-row form-row-2">
                <div>
                  <label className="form-label" htmlFor="contact-phone">
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="contact-context">
                  Context
                </label>
                <textarea
                  id="contact-context"
                  name="context"
                  className="form-input form-textarea"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="contact-notes">
                  Notes
                </label>
                <textarea
                  id="contact-notes"
                  name="notes"
                  className="form-input form-textarea"
                  rows={2}
                />
              </div>

              <div className="form-row form-row-date">
                <label
                  className="form-label"
                  htmlFor="contact-last-date"
                >
                  Last interaction
                </label>
                <input
                  id="contact-last-date"
                  name="lastInteractionDate"
                  type="date"
                  className="form-input"
                  defaultValue={todayInputValue()}
                />
              </div>

              <div className="form-row">
                <label
                  className="form-label"
                  htmlFor="contact-last-summary"
                >
                  Interaction summary
                </label>
                <textarea
                  id="contact-last-summary"
                  name="lastInteractionSummary"
                  className="form-input form-textarea interaction-summary-input"
                  rows={3}
                />
              </div>

              {state && !state.ok && (
                <p className="form-error" role="alert">
                  {state.error}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={pending}
                >
                  {pending ? 'Saving…' : 'Save contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
