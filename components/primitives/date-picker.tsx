import { InputHTMLAttributes, forwardRef } from "react";

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, style, ...props }, ref) => (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.4rem", color: "var(--text-primary)" }}>
          {label}
        </label>
      )}
      <input
        type="date"
        ref={ref}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: "8px",
          border: "1px solid var(--border-default)",
          background: "var(--bg-subtle)", color: "var(--text-primary)",
          fontSize: "0.9375rem", fontFamily: "var(--font-body)",
          outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
          boxSizing: "border-box",
          cursor: "pointer",
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

DatePicker.displayName = "DatePicker";
