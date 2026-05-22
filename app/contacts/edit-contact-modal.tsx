'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import type { Contact } from '../../lib/crm'
import { updateContactAction, type UpdateContactResult } from './actions'
import ContactFormFields, { type ContactFormValues } from './contact-form-fields'

const initialState: UpdateContactResult | null = null

function toFormValues(contact: Contact): ContactFormValues {
  return {
    name: contact.name,
    relationship: contact.relationship,
    source: contact.source,
    tags: contact.tags.join(', '),
    participantRole: contact.type ?? '',
    phone: contact.phone,
    email: contact.email,
    context: contact.context,
    notes: contact.notes,
  }
}

export default function EditContactModal({
  contact,
  onUpdated,
}: {
  contact: Contact
  onUpdated?: (result: UpdateContactResult) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (_prev: UpdateContactResult | null, formData: FormData) =>
      updateContactAction(formData),
    initialState,
  )

  useEffect(() => {
    if (state?.ok) {
      onUpdated?.(state)
      setOpen(false)
      router.refresh()
    }
  }, [state, onUpdated, router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const formValues = toFormValues(contact)

  return (
    <>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => setOpen(true)}
      >
        Edit
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
            aria-labelledby="edit-contact-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="edit-contact-title" className="modal-title">
                Edit contact
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

            <form action={formAction} className="modal-form" key={contact.id}>
              <input type="hidden" name="slug" value={contact.id} />
              <ContactFormFields
                idPrefix="edit-contact"
                values={formValues}
                autoFocusName
              />

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
                  {pending ? 'Saving & analyzing…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
