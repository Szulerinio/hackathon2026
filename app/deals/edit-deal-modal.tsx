'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import type { DealRow } from '../../lib/crm'
import { updateDealAction, type UpdateDealResult } from './actions'
import DealFormFields, {
  type ContactOption,
  type DealFormValues,
  type ListingOption,
} from './deal-form-fields'

const initialState: UpdateDealResult | null = null

function toFormValues(deal: DealRow): DealFormValues {
  return {
    buyerSlug: deal.buyerSlug,
    listingId: String(deal.listingId),
    status: deal.status,
    value: deal.value,
    lastActivityDate: deal.lastActivityDate,
  }
}

export default function EditDealModal({
  deal,
  buyers,
  listings,
}: {
  deal: DealRow
  buyers: ContactOption[]
  listings: ListingOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (_prev: UpdateDealResult | null, formData: FormData) =>
      updateDealAction(formData),
    initialState,
  )

  useEffect(() => {
    if (state?.ok) {
      setOpen(false)
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

  const formValues = toFormValues(deal)

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
            aria-labelledby="edit-deal-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="edit-deal-title" className="modal-title">
                Edit deal
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

            <form action={formAction} className="modal-form" key={deal.id}>
              <input type="hidden" name="id" value={deal.id} />
              <DealFormFields
                idPrefix={`edit-deal-${deal.id}`}
                buyers={buyers}
                listings={listings}
                values={formValues}
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
                  {pending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
