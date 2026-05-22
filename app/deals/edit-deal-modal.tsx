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
  const [menuOpen, setMenuOpen] = useState(false)
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
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          style={{
            width: 28, height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text3)',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Deal options"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
            <div style={{
              position: 'absolute', top: 32, right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              minWidth: 120,
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setOpen(true) }}
                style={{
                  width: '100%', padding: '9px 14px',
                  textAlign: 'left', fontSize: 13,
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Edit deal
              </button>
            </div>
          </>
        )}
      </div>

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
