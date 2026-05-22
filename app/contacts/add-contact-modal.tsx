'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { alertMessageFromMeta, stashContactAiBanner } from './alert-feedback'
import { createContactAction, type CreateContactResult } from './actions'
import ContactFormFields from './contact-form-fields'

const initialState: CreateContactResult | null = null

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
      const msg = alertMessageFromMeta(state)
      if (msg) stashContactAiBanner(state.slug, msg)
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
              <ContactFormFields idPrefix="add-contact" autoFocusName />

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
                  {pending ? 'Saving & analyzing…' : 'Save contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
