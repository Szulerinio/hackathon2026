'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'
import { createListingAction, type CreateListingResult } from './actions'
import ListingFormFields, { type SellerOption } from './listing-form-fields'

const initialState: CreateListingResult | null = null

export default function AddListingModal({
  sellers,
}: {
  sellers: SellerOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    async (_prev: CreateListingResult | null, formData: FormData) =>
      createListingAction(formData),
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

  const noSellers = sellers.length === 0

  return (
    <>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen(true)}
        disabled={noSellers}
        title={noSellers ? 'Add a contact first to use as seller' : undefined}
      >
        Add listing
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
            aria-labelledby="add-listing-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="add-listing-title" className="modal-title">
                Add listing
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
              <ListingFormFields
                idPrefix="add-listing"
                sellers={sellers}
                values={{ status: 'active', daysOnMarket: '0' }}
                autoFocusAddress
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
                  {pending ? 'Saving…' : 'Save listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
