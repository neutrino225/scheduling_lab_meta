"use client";

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: "2px",
        background: "var(--bg-subtle)",
        borderRadius: "var(--radius-buttons)",
        padding: "3px",
        height: "var(--control-height, 34px)",
        alignItems: "center",
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "0 14px",
              borderRadius: "calc(var(--radius-buttons) - 2px)",
              border: "none",
              background: active ? "var(--accent-primary)" : "transparent",
              color: active ? "var(--accent-text)" : "var(--text-muted)",
              fontSize: "var(--text-body-sm)",
              fontWeight: active ? 600 : 500,
              fontFamily: "inherit",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.1s",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              letterSpacing: "var(--tracking-body-sm)",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.color = "var(--accent-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
