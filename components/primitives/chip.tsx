"use client";

type ChipVariant = "success" | "warning" | "danger" | "info" | "muted";

const chipStyle: Record<ChipVariant, { color: string; background: string; borderColor: string }> = {
  success: {
    color: "var(--status-success)",
    background: "var(--status-success-surface)",
    borderColor: "var(--status-success)",
  },
  warning: {
    color: "var(--status-warning)",
    background: "var(--status-warning-surface)",
    borderColor: "var(--status-warning)",
  },
  danger: {
    color: "var(--accent-primary)",
    background: "var(--status-danger-surface)",
    borderColor: "var(--accent-primary)",
  },
  info: {
    color: "var(--status-info)",
    background: "var(--status-info-surface)",
    borderColor: "var(--status-info)",
  },
  muted: {
    color: "var(--text-subtle)",
    background: "var(--bg-subtle)",
    borderColor: "var(--border-default)",
  },
};

const statusMap: Record<string, ChipVariant> = {
  published: "success",
  done: "success",
  draft: "muted",
  scheduled: "info",
  pending: "info",
  processing: "warning",
  running: "warning",
  failed: "danger",
};

export function chipVariant(status: string): ChipVariant {
  return statusMap[status] || "muted";
}

export function Chip({ variant, children, style }: { variant: ChipVariant; children: React.ReactNode; style?: React.CSSProperties }) {
  const s = chipStyle[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0 12px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-caption)",
        fontWeight: 600,
        lineHeight: 1.6,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: s.background,
        color: s.color,
        border: `1px solid ${s.borderColor}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
