interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "64px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "var(--color-hover-overlay)", border: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>
        <svg width="22" height="22" fill="none" stroke="var(--color-ink-3)" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)", marginBottom: 6 }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: "var(--color-ink-2)", marginBottom: 20, maxWidth: 280, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
