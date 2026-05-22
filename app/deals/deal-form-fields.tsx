export type DealFormValues = {
  buyerSlug: string
  listingId: string
  status: string
  value: string
  lastActivityDate: string
}

export type ContactOption = {
  slug: string
  name: string
}

export type ListingOption = {
  id: number
  address: string
}

type DealFormFieldsProps = {
  idPrefix: string
  buyers: ContactOption[]
  listings: ListingOption[]
  values?: Partial<DealFormValues>
  autoFocusValue?: boolean
}

export default function DealFormFields({
  idPrefix,
  buyers,
  listings,
  values = {},
  autoFocusValue = false,
}: DealFormFieldsProps) {
  const p = (field: string) => `${idPrefix}-${field}`

  return (
    <>
      <div className="form-row form-row-2">
        <div>
          <label className="form-label" htmlFor={p('buyer')}>
            Buyer <span className="form-required">*</span>
          </label>
          <select
            id={p('buyer')}
            name="buyerSlug"
            className="form-input"
            required
            defaultValue={values.buyerSlug ?? ''}
          >
            <option value="" disabled>
              Select buyer…
            </option>
            {buyers.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor={p('listing')}>
            Property <span className="form-required">*</span>
          </label>
          <select
            id={p('listing')}
            name="listingId"
            className="form-input"
            required
            defaultValue={values.listingId ?? ''}
          >
            <option value="" disabled>
              Select property…
            </option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.address}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row form-row-2">
        <div>
          <label className="form-label" htmlFor={p('status')}>
            Status
          </label>
          <select
            id={p('status')}
            name="status"
            className="form-input"
            defaultValue={values.status ?? 'viewing'}
          >
            <option value="potential">Potential</option>
            <option value="viewing">Viewing</option>
            <option value="offer">Offer</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor={p('value')}>
            Value
          </label>
          <input
            id={p('value')}
            name="value"
            className="form-input"
            placeholder="420 000 PLN"
            defaultValue={values.value ?? ''}
            autoFocus={autoFocusValue}
          />
        </div>
      </div>

      <div className="form-row">
        <label className="form-label" htmlFor={p('lastActivity')}>
          Last activity <span className="form-required">*</span>
        </label>
        <input
          id={p('lastActivity')}
          name="lastActivityDate"
          type="date"
          className="form-input"
          required
          defaultValue={values.lastActivityDate ?? ''}
        />
      </div>
    </>
  )
}
