import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = "", style, children, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 500, marginBottom: "0.25rem", color: "var(--text-primary)", letterSpacing: "var(--tracking-body-sm)" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative", height: style?.height || "var(--control-height, 34px)" }}>
          <select
            ref={ref}
            className={className}
            style={{
              width: "100%", height: "100%", padding: "0 36px 0 12px",
              borderRadius: "var(--radius-buttons)", border: "1px solid var(--border-default)",
              background: "var(--bg-subtle)", color: "var(--text-primary)",
              fontSize: "var(--text-body-sm)", fontFamily: "inherit",
              cursor: "pointer", appearance: "none",
              WebkitAppearance: "none", MozAppearance: "none",
              outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
              boxSizing: "border-box",
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent-primary)";
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
            {...props}
          >
            {children}
          </select>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              position: "absolute", right: "10px", top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
              color: "var(--text-muted)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
