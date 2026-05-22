'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { ActivityEvent, Contact, DealRow } from '../../../lib/crm'
import {
  alertMessageFromMeta,
  popContactAiBanner,
} from '../alert-feedback'
import type { ActivityActionResult } from './activity-actions'
import type { UpdateContactResult } from '../actions'
import AiAlertBanner from '../ai-alert-banner'
import EditContactModal from '../edit-contact-modal'
import ActivityLog from './activity-log'

function fromActivityResult(result: ActivityActionResult): string | null {
  if (!result.ok) return null
  return alertMessageFromMeta(result)
}

function fromContactUpdate(result: UpdateContactResult): string | null {
  if (!result.ok) return null
  return alertMessageFromMeta(result)
}

export default function ContactDetailClient({
  contact,
  activities,
  deals = [],
  backLink,
  children,
}: {
  contact: Contact
  activities: ActivityEvent[]
  deals?: DealRow[]
  backLink: ReactNode
  children: ReactNode
}) {
  const [alertBanner, setAlertBanner] = useState<string | null>(null)

  useEffect(() => {
    const stashed = popContactAiBanner(contact.id)
    if (stashed) setAlertBanner(stashed)
  }, [contact.id])

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        {backLink}
        <EditContactModal
          contact={contact}
          onUpdated={(result) => {
            const msg = fromContactUpdate(result)
            if (msg) setAlertBanner(msg)
          }}
        />
      </div>

      {alertBanner && (
        <AiAlertBanner message={alertBanner} onDismiss={() => setAlertBanner(null)} />
      )}

      {children}

      <ActivityLog
        activities={activities}
        slug={contact.id}
        deals={deals}
        onAlert={(result) => {
          const msg = fromActivityResult(result)
          if (msg) setAlertBanner(msg)
        }}
      />
    </>
  )
}
