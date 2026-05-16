"use client";

import { useCallback, useMemo } from "react";
import { Select } from "@/components/primitives/select";
import { SegmentedControl } from "@/components/primitives/segmented-control";

interface TimePickerProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  required?: boolean;
  style?: React.CSSProperties;
}

function parseValue(v: string | undefined) {
  if (!v) return { hour12: 12, minute: 0, isPM: false };
  const parts = v.split(":");
  const h24 = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h24) || isNaN(m)) return { hour12: 12, minute: 0, isPM: false };
  const isPM = h24 >= 12;
  const hour12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { hour12, minute: m, isPM };
}

function formatHHmm(hour12: number, minute: number, isPM: boolean) {
  const h24 = isPM
    ? (hour12 === 12 ? 12 : hour12 + 12)
    : (hour12 === 12 ? 0 : hour12);
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function TimePicker({ label, value, onChange, style }: TimePickerProps) {
  const parsed = useMemo(() => parseValue(value), [value]);

  const emit = useCallback(
    (hour12: number, minute: number, isPM: boolean) => {
      if (!onChange) return;
      onChange({ target: { value: formatHHmm(hour12, minute, isPM) } });
    },
    [onChange]
  );

  return (
    <div style={{ width: "100%", ...style }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "var(--text-body-sm)",
            fontWeight: 500,
            marginBottom: "0.25rem",
            color: "var(--text-primary)",
            letterSpacing: "var(--tracking-body-sm)",
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          gap: "6px",
          height: "var(--control-height, 34px)",
          alignItems: "center",
          flexWrap: "nowrap",
          width: "100%",
        }}
      >
        {/* Hour */}
        <div style={{ flex: "1 1 0px", height: "100%", minWidth: 0 }}>
          <Select
            value={parsed.hour12}
            onChange={(e) => emit(Number(e.target.value), parsed.minute, parsed.isPM)}
            style={{ padding: "0 28px 0 12px" }}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        </div>

        <span
          style={{
            color: "var(--text-muted)",
            fontSize: "var(--text-body-sm)",
            fontWeight: 600,
            padding: "0 2px"
          }}
        >
          :
        </span>

        {/* Minute */}
        <div style={{ flex: "1 1 0px", height: "100%", minWidth: 0 }}>
          <Select
            value={parsed.minute}
            onChange={(e) => emit(parsed.hour12, Number(e.target.value), parsed.isPM)}
            style={{ padding: "0 28px 0 12px" }}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </Select>
        </div>

        {/* AM / PM */}
        <div style={{ flexShrink: 0 }}>
          <SegmentedControl
            options={[
              { label: "AM", value: "am" },
              { label: "PM", value: "pm" }
            ]}
            value={parsed.isPM ? "pm" : "am"}
            onChange={(v) => emit(parsed.hour12, parsed.minute, v === "pm")}
          />
        </div>
      </div>
    </div>
  );
}

