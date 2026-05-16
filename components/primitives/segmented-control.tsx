"use client";

import { useRef, useState, useLayoutEffect } from "react";

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const activeIndex = options.findIndex((o) => o.value === value);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>("[data-seg]");
    const btn = buttons[activeIndex];
    if (!btn) return;

    const update = () => {
      const c = containerRef.current!;
      const cr = c.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      setIndicator({ left: br.left - cr.left, width: br.width });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeIndex, options]);

  const dur = reducedMotion ? "0s" : "0.35s";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        gap: "2px",
        background: "var(--bg-subtle)",
        borderRadius: "var(--radius-buttons)",
        padding: "3px",
        height: "var(--control-height, 34px)",
        alignItems: "center",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {indicator && (
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: 0,
            height: "calc(100% - 6px)",
            width: indicator.width,
            borderRadius: "calc(var(--radius-buttons) - 2px)",
            background: "var(--accent-primary)",
            transform: `translateX(${indicator.left}px)`,
            transition: `transform ${dur} cubic-bezier(0.22, 1, 0.36, 1)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {options.map((opt, i) => {
        const active = value === opt.value;
        const isHovered = hoveredIndex === i && !active;
        const isPressed = pressedIndex === i;

        let transform = "scale(1)";
        if (isPressed) transform = "scale(0.94)";
        else if (isHovered && !reducedMotion) transform = "scale(1.05)";

        const transitionParts = [
          `color ${reducedMotion ? "0s" : "0.2s"}`,
        ];
        if (!reducedMotion) {
          const transformDur = isPressed ? "0.05s" : "0.2s";
          transitionParts.push(
            `transform ${transformDur} cubic-bezier(0.22, 1, 0.36, 1)`
          );
        }

        return (
          <button
            key={opt.value}
            data-seg
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(opt.value)}
            onMouseDown={() => setPressedIndex(i)}
            onMouseUp={() => setPressedIndex(null)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => {
              setHoveredIndex(null);
              setPressedIndex(null);
            }}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "0 14px",
              borderRadius: "calc(var(--radius-buttons) - 4px)",
              border: "none",
              background: isHovered ? "var(--bg-muted)" : "transparent",
              color: active
                ? "var(--accent-text)"
                : isHovered
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              fontSize: "var(--text-body-sm)",
              fontWeight: active ? 600 : 500,
              fontFamily: "inherit",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              whiteSpace: "nowrap",
              letterSpacing: "var(--tracking-body-sm)",
              transition: transitionParts.join(", "),
              transform,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
