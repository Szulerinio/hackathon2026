'use client'

export default function AiAlertBanner({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--text2)',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        padding: '8px 10px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span>
        <span className="ai-badge" style={{ marginRight: 6 }}>
          ✦ AI
        </span>
        {message}
      </span>
      <button
        type="button"
        className="btn-ghost"
        onClick={onDismiss}
        style={{ fontSize: 10, padding: '0 4px', flexShrink: 0 }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
