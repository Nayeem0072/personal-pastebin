import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string; description?: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: "var(--color-ink-2)" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          <select
            ref={ref}
            id={inputId}
            className={`pp-input ${className}`}
            style={{ paddingRight: 32, appearance: "none", cursor: "pointer", ...style }}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--color-ink-3)",
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
