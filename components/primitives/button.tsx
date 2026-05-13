import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "outline" | "subtle" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

function variantStyle(v: Variant): React.CSSProperties {
  switch (v) {
    case "primary":
      return {
        background: "var(--accent-primary)", color: "#0e1117",
        border: "none",
      };
    case "outline":
      return {
        background: "transparent", color: "var(--text-primary)",
        border: "1px solid var(--border-default)",
      };
    case "subtle":
      return {
        background: "transparent", color: "var(--text-muted)",
        border: "none",
      };
    case "danger":
      return {
        background: "transparent", color: "var(--status-danger)",
        border: "1px solid var(--status-danger)",
      };
  }
}

const hoverStyle: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--accent-primary)", filter: "brightness(0.88)", color: "#0e1117" },
  outline: { background: "var(--bg-subtle)", borderColor: "var(--accent-primary)" },
  subtle: { background: "var(--bg-subtle)", color: "var(--text-primary)" },
  danger: { background: "var(--status-danger-surface)" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "outline", className = "", style, disabled, onMouseEnter, onMouseLeave, children, ...props }, ref) => {
    const base: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
      padding: "7px 16px", borderRadius: "7px",
      fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.01em",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background 0.12s, border-color 0.12s, filter 0.12s",
      fontFamily: "inherit",
      ...variantStyle(variant),
      ...style,
    };

    return (
      <button
        ref={ref}
        className={className}
        style={base}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) Object.assign(e.currentTarget.style, hoverStyle[variant]);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            const vs = variantStyle(variant);
            Object.assign(e.currentTarget.style, {
              background: vs.background || "",
              borderColor: vs.borderColor || "",
              color: vs.color || "",
            });
          }
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
