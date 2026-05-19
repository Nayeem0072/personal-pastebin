interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "orange" | "green" | "red" | "blue" | "purple" | "yellow";
  className?: string;
}

const styles: Record<string, React.CSSProperties> = {
  default: { background: "rgba(255,255,255,0.07)", color: "#8A8AA2", border: "1px solid #38383F" },
  orange:  { background: "rgba(0,196,255,0.12)",   color: "#00C4FF", border: "1px solid rgba(0,196,255,0.25)" },
  green:   { background: "rgba(74,222,128,0.1)",   color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" },
  red:     { background: "rgba(248,113,113,0.1)",  color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" },
  blue:    { background: "rgba(96,165,250,0.1)",   color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" },
  purple:  { background: "rgba(167,139,250,0.1)",  color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" },
  yellow:  { background: "rgba(251,191,36,0.1)",   color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" },
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}

export function PrivacyBadge({ privacy }: { privacy: string }) {
  if (privacy === "public")  return <Badge variant="green">public</Badge>;
  if (privacy === "group")   return <Badge variant="blue">group</Badge>;
  return <Badge variant="yellow">private</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <Badge variant="purple">owner</Badge>;
  if (role === "admin") return <Badge variant="blue">admin</Badge>;
  return <Badge>member</Badge>;
}
