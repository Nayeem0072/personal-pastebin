import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: "#8A8AA2" }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`pp-input ${className}`}
          style={{
            height: "auto",
            minHeight: 220,
            padding: "12px",
            resize: "vertical",
            lineHeight: 1.75,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            borderColor: error ? "#ef4444" : undefined,
            ...style,
          }}
          {...props}
        />
        {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
