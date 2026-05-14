"use client";

import { forwardRef, useCallback } from "react";
import DatePickerLib from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from "@/lib/client/theme";

interface TimePickerProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  required?: boolean;
  style?: React.CSSProperties;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, value, onChange, style, ...props }, ref) => {
    const { theme } = useTheme();

    const selected = value ? new Date(`1970-01-01T${value}:00`) : null;

    const handleChange = useCallback(
      (date: Date | null) => {
        if (onChange) {
          const str = date
            ? date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
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
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="HH:mm"
              placeholderText="Select time"
              ref={ref as never}
              calendarClassName="dp-calendar"
              wrapperClassName="dp-wrapper"
              popperClassName="dp-popper tp-popper"
              popperPlacement="bottom-start"
              {...(props as Record<string, unknown>)}
            />
        </div>
      </div>
    );
  }
);

TimePicker.displayName = "TimePicker";
