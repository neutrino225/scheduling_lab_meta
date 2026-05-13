import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, style, ...props }, ref) => (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: "7px",
          border: "1px solid var(--border-default)",
          background: "var(--bg-subtle)", color: "var(--text-primary)",
          fontSize: "0.9375rem", fontFamily: "inherit",
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
      />
    </div>
  )
);

Input.displayName = "Input";
