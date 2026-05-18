import { forwardRef } from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className = "", id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: "#8A8AA2" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          {prefix && (
            <div style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "#555568", pointerEvents: "none", display: "flex", alignItems: "center",
            }}>
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`pp-input ${className}`}
            style={{ paddingLeft: prefix ? 36 : 12, borderColor: error ? "#ef4444" : undefined, ...style }}
            {...props}
          />
        </div>
        {hint && !error && <p style={{ fontSize: 12, color: "#555568", lineHeight: 1.5 }}>{hint}</p>}
        {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
