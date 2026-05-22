'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { formatDate, getCrmToday } from '../../lib/decay'
import { createDealAction, type CreateDealResult } from './actions'
import DealFormFields, {
  type ContactOption,
  type ListingOption,
} from './deal-form-fields'

const initialState: CreateDealResult | null = null

function todayInputValue(): string {
  return formatDate(getCrmToday())
}

export default function AddDealModal({
  buyers,
  listings,
}: {
  buyers: ContactOption[]
  listings: ListingOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    async (_prev: CreateDealResult | null, formData: FormData) =>
      createDealAction(formData),
    initialState,
  )

  useEffect(() => {
    if (state?.ok) {
      setOpen(false)
      formRef.current?.reset()
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

  const disabled = buyers.length === 0 || listings.length === 0
  const disabledTitle =
    buyers.length === 0
      ? 'Add a contact first to use as buyer'
      : listings.length === 0
        ? 'Add a listing first to link to this deal'
        : undefined

  return (
    <>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabledTitle}
      >
        + Add deal
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
            aria-labelledby="add-deal-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="add-deal-title" className="modal-title">
                Add deal
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
              <DealFormFields
                idPrefix="add-deal"
                buyers={buyers}
                listings={listings}
                values={{ status: 'viewing', lastActivityDate: todayInputValue() }}
                autoFocusValue
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
                  {pending ? 'Saving…' : 'Save deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
