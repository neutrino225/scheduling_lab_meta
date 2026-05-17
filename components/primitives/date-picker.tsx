"use client";

import { forwardRef, useCallback } from "react";
import DatePickerLib from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from "@/lib/client/theme";

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  min?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, min, style, ...props }, ref) => {
    const { theme } = useTheme();

    const selected = value ? new Date(value + "T00:00:00") : null;
    const minDate = min ? new Date(min + "T00:00:00") : undefined;

    const handleChange = useCallback(
      (date: Date | null) => {
        if (onChange) {
          const str = date
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
            : "";
          onChange({ target: { value: str } });
        }
      },
      [onChange]
    );

    return (
      <div>
        {label && (
          <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 500, marginBottom: "0.4rem", color: "var(--text-primary)", letterSpacing: "var(--tracking-body-sm)" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative", ...style }} data-theme={theme}>
            <DatePickerLib
              selected={selected}
              onChange={handleChange}
              minDate={minDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date"
              ref={ref as never}
              calendarClassName="dp-calendar"
              wrapperClassName="dp-wrapper"
              popperClassName="dp-popper"
              popperPlacement="bottom-start"
              {...(props as Record<string, unknown>)}
            />
        </div>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
