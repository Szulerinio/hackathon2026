export type ListingFormValues = {
  address: string
  description: string
  price: string
  ownerSlug: string
  status: string
  daysOnMarket: string
}

export type SellerOption = {
  slug: string
  name: string
}

type ListingFormFieldsProps = {
  idPrefix: string
  sellers: SellerOption[]
  values?: Partial<ListingFormValues>
  autoFocusAddress?: boolean
}

export default function ListingFormFields({
  idPrefix,
  sellers,
  values = {},
  autoFocusAddress = false,
}: ListingFormFieldsProps) {
  const p = (field: string) => `${idPrefix}-${field}`

  return (
    <>
      <div className="form-row">
        <label className="form-label" htmlFor={p('address')}>
          Address <span className="form-required">*</span>
        </label>
        <input
          id={p('address')}
          name="address"
          className="form-input"
          required
          minLength={5}
          placeholder="ul. Example 1/2, Kraków"
          defaultValue={values.address ?? ''}
          autoFocus={autoFocusAddress}
        />
      </div>

      <div className="form-row">
        <label className="form-label" htmlFor={p('description')}>
          Description
        </label>
        <textarea
          id={p('description')}
          name="description"
          className="form-input form-textarea"
          rows={3}
          placeholder="e.g. 3-bedroom apartment, south-facing balcony, recently renovated kitchen."
          defaultValue={values.description ?? ''}
        />
      </div>

      <div className="form-row form-row-2">
        <div>
          <label className="form-label" htmlFor={p('price')}>
            Price
          </label>
          <input
            id={p('price')}
            name="price"
            className="form-input"
            placeholder="850 000 PLN"
            defaultValue={values.price ?? ''}
          />
        </div>
        <div>
          <label className="form-label" htmlFor={p('status')}>
            Status
          </label>
          <select
            id={p('status')}
            name="status"
            className="form-input"
            defaultValue={values.status ?? 'active'}
          >
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      <div className="form-row form-row-2">
        <div>
          <label className="form-label" htmlFor={p('seller')}>
            Seller <span className="form-required">*</span>
          </label>
          <select
            id={p('seller')}
            name="ownerSlug"
            className="form-input"
            required
            defaultValue={values.ownerSlug ?? ''}
          >
            <option value="" disabled>
              Select seller…
            </option>
            {sellers.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor={p('days')}>
            Days on market
          </label>
          <input
            id={p('days')}
            name="daysOnMarket"
            type="number"
            min={0}
            className="form-input"
            defaultValue={values.daysOnMarket ?? '0'}
          />
        </div>
      </div>
    </>
  )
}
