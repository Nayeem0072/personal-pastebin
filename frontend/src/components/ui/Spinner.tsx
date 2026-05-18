export function Spinner({ size = 18, color = "#00C4FF" }: { size?: number; color?: string }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke={color} strokeWidth="3" />
      <path style={{ opacity: 0.9 }} fill={color} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <Spinner size={28} />
    </div>
  );
}
