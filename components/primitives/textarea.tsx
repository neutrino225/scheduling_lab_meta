import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, style, ...props }, ref) => (
    <div>
      {label && (
        <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 500, marginBottom: "0.25rem", color: "var(--text-primary)", letterSpacing: "var(--tracking-body-sm)" }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: "var(--radius-buttons)",
          border: "1px solid var(--border-default)",
          background: "var(--bg-subtle)", color: "var(--text-primary)",
          fontSize: "var(--text-body-sm)", fontFamily: "inherit",
          outline: "none", resize: "vertical",
          minHeight: "100px", boxSizing: "border-box",
          transition: "border-color 0.15s, box-shadow 0.15s",
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

Textarea.displayName = "Textarea";
