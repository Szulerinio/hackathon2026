export type ContactFormValues = {
  name: string
  relationship: string
  source: string
  tags: string
  participantRole: '' | 'seller' | 'buyer' | 'both'
  phone: string
  email: string
  context: string
  notes: string
  lastInteractionDate: string
  lastInteractionSummary: string
}

type ContactFormFieldsProps = {
  idPrefix: string
  values?: Partial<ContactFormValues>
  autoFocusName?: boolean
}

export default function ContactFormFields({
  idPrefix,
  values = {},
  autoFocusName = false,
}: ContactFormFieldsProps) {
  const p = (field: string) => `${idPrefix}-${field}`

  return (
    <>
      <div className="form-row">
        <label className="form-label" htmlFor={p('name')}>
          Name <span className="form-required">*</span>
        </label>
        <input
          id={p('name')}
          name="name"
          className="form-input"
          required
          minLength={2}
          defaultValue={values.name ?? ''}
          autoFocus={autoFocusName}
        />
      </div>

      <div className="form-row form-row-2">
        <div>
          <label className="form-label" htmlFor={p('relationship')}>
            Relationship
          </label>
          <input
            id={p('relationship')}
            name="relationship"
            className="form-input"
            defaultValue={values.relationship ?? ''}
          />
        </div>
        <div>
          <label className="form-label" htmlFor={p('source')}>
            Source
          </label>
          <input
            id={p('source')}
            name="source"
            className="form-input"
            defaultValue={values.source ?? ''}
          />
        </div>
      </div>

      <div className="form-row form-row-2">
        <div>
          <label className="form-label" htmlFor={p('tags')}>
            Tags
          </label>
          <input
            id={p('tags')}
            name="tags"
            className="form-input"
            placeholder="active client, warm lead"
            defaultValue={values.tags ?? ''}
          />
        </div>
        <div>
          <label className="form-label" htmlFor={p('role')}>
            Role
          </label>
          <select
            id={p('role')}
            name="participantRole"
            className="form-input"
            defaultValue={values.participantRole ?? ''}
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
          <label className="form-label" htmlFor={p('phone')}>
            Phone
          </label>
          <input
            id={p('phone')}
            name="phone"
            type="tel"
            className="form-input"
            defaultValue={values.phone ?? ''}
          />
        </div>
        <div>
          <label className="form-label" htmlFor={p('email')}>
            Email
          </label>
          <input
            id={p('email')}
            name="email"
            type="email"
            className="form-input"
            defaultValue={values.email ?? ''}
          />
        </div>
      </div>

      <div className="form-row">
        <label className="form-label" htmlFor={p('context')}>
          Context
        </label>
        <textarea
          id={p('context')}
          name="context"
          className="form-input form-textarea"
          rows={2}
          defaultValue={values.context ?? ''}
        />
      </div>

      <div className="form-row">
        <label className="form-label" htmlFor={p('notes')}>
          Notes
        </label>
        <textarea
          id={p('notes')}
          name="notes"
          className="form-input form-textarea"
          rows={2}
          defaultValue={values.notes ?? ''}
        />
      </div>

      <div className="form-row form-row-date">
        <label className="form-label" htmlFor={p('last-date')}>
          Last interaction
        </label>
        <input
          id={p('last-date')}
          name="lastInteractionDate"
          type="date"
          className="form-input"
          defaultValue={values.lastInteractionDate ?? ''}
        />
      </div>

      <div className="form-row">
        <label className="form-label" htmlFor={p('last-summary')}>
          Interaction summary
        </label>
        <textarea
          id={p('last-summary')}
          name="lastInteractionSummary"
          className="form-input form-textarea interaction-summary-input"
          rows={3}
          defaultValue={values.lastInteractionSummary ?? ''}
        />
      </div>
    </>
  )
}
