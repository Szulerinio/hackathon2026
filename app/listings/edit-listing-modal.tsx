'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import type { ListingCard } from '../../lib/crm'
import { updateListingAction, type UpdateListingResult } from './actions'
import ListingFormFields, {
  type ListingFormValues,
  type SellerOption,
} from './listing-form-fields'

const initialState: UpdateListingResult | null = null

function toFormValues(listing: ListingCard): ListingFormValues {
  return {
    address: listing.address,
    price: listing.price,
    ownerSlug: listing.sellerSlug,
    status: listing.status,
    daysOnMarket: String(listing.daysOnMarket),
  }
}

export default function EditListingModal({
  listing,
  sellers,
}: {
  listing: ListingCard
  sellers: SellerOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (_prev: UpdateListingResult | null, formData: FormData) =>
      updateListingAction(formData),
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

  const formValues = toFormValues(listing)

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
            background: 'rgba(255,255,255,0.92)',
            color: 'var(--text)',
            fontSize: 16,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          aria-label="Listing options"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setMenuOpen(false)}
            />
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
                Edit listing
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
            aria-labelledby="edit-listing-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="edit-listing-title" className="modal-title">
                Edit listing
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

            <form action={formAction} className="modal-form" key={listing.id}>
              <input type="hidden" name="id" value={listing.id} />
              <ListingFormFields
                idPrefix={`edit-listing-${listing.id}`}
                sellers={sellers}
                values={formValues}
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
