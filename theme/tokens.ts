import { defineConfig } from "@chakra-ui/react";

export const appConfig = defineConfig({
  cssVarsPrefix: "metalab",
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f8f9fb" },
          100: { value: "#f1f3f7" },
          200: { value: "#e7ebf2" },
          300: { value: "#d9dee8" },
          400: { value: "#c4ccda" },
          500: { value: "#aab4c5" },
          600: { value: "#80899a" },
          700: { value: "#5f6775" },
          800: { value: "#3e4450" },
          900: { value: "#232730" },
        },
        neutral: {
          50: { value: "#f0f4fb" },
          100: { value: "#d6deea" },
          200: { value: "#b8c3d4" },
          300: { value: "#98a5b9" },
          400: { value: "#7d899c" },
          500: { value: "#646f83" },
          600: { value: "#4b5567" },
          700: { value: "#353d4c" },
          800: { value: "#232a36" },
          900: { value: "#161c26" },
          950: { value: "#0c1119" },
        },
        success: {
          500: { value: "#188a5b" },
          600: { value: "#136f49" },
        },
        warning: {
          500: { value: "#c8841f" },
          600: { value: "#a56812" },
        },
        danger: {
          500: { value: "#c9483a" },
          600: { value: "#a7392d" },
        },
        info: {
          500: { value: "#2f7dbf" },
          600: { value: "#23679f" },
        },
      },
      fonts: {
        heading: { value: "var(--font-heading)" },
        body: { value: "var(--font-body)" },
        mono: { value: "var(--font-mono)" },
      },
      fontSizes: {
        xs: { value: "0.75rem" },
        sm: { value: "0.875rem" },
        md: { value: "1rem" },
        lg: { value: "1.125rem" },
        xl: { value: "1.25rem" },
        "2xl": { value: "1.5rem" },
        "3xl": { value: "1.875rem" },
      },
      spacing: {
        18: { value: "4.5rem" },
        26: { value: "6.5rem" },
      },
      radii: {
        card: { value: "0.875rem" },
      },
      shadows: {
        panel: { value: "0 16px 42px rgba(0, 0, 0, 0.36)" },
      },
      sizes: {
        content: { value: "75rem" },
      },
      zIndex: {
        appBar: { value: "40" },
        drawer: { value: "1200" },
      },
    },
    semanticTokens: {
      colors: {
        "bg.canvas": { value: "#070709" },
        "bg.surface": { value: "#0f1013" },
        "bg.subtle": { value: "#17191f" },
        "text.primary": { value: "#f4f5f7" },
        "text.muted": { value: "#a5aab5" },
        "border.default": { value: "#272a32" },
        "accent.primary": { value: "{colors.brand.300}" },
        "accent.surface": { value: "#1d212a" },
        "accent.text": { value: "#f4f5f7" },
        "status.success": { value: "{colors.success.500}" },
        "status.warning": { value: "{colors.warning.500}" },
        "status.danger": { value: "{colors.danger.500}" },
        "status.info": { value: "{colors.info.500}" },
        "status.successSurface": { value: "rgba(24, 138, 91, 0.16)" },
        "status.warningSurface": { value: "rgba(200, 132, 31, 0.16)" },
        "status.dangerSurface": { value: "rgba(201, 72, 58, 0.16)" },
        "status.infoSurface": { value: "rgba(47, 125, 191, 0.16)" },
        fg: { value: "{colors.text.primary}" },
        "fg.muted": { value: "{colors.text.muted}" },
        "fg.subtle": { value: "#858b97" },
        bg: { value: "{colors.bg.canvas}" },
        "bg.muted": { value: "#12141a" },
        border: { value: "{colors.border.default}" },
      },
    },
  },
  globalCss: {
    "html, body": {
      minHeight: "100%",
      background: "{colors.bg.canvas}",
      color: "{colors.text.primary}",
      fontFamily: "body",
      backgroundImage:
        "radial-gradient(1000px 540px at 10% -14%, rgba(244, 245, 247, 0.08), transparent 64%), radial-gradient(920px 560px at 92% 0%, rgba(168, 175, 188, 0.05), transparent 66%)",
      letterSpacing: "0.01em",
      lineHeight: "1.45",
    },
    "*::placeholder": {
      color: "{colors.text.muted}",
    },
    "input, textarea, select": {
      color: "{colors.text.primary}",
    },
    "input, textarea, select, [data-scope='select']": {
      background: "{colors.bg.subtle}",
      borderColor: "{colors.border.default}",
    },
    "input:hover, textarea:hover, select:hover, [data-scope='select']:hover": {
      borderColor: "{colors.accent.primary}",
    },
    "input:focus-visible, textarea:focus-visible, select:focus-visible": {
      borderColor: "{colors.accent.primary}",
      boxShadow: "0 0 0 1px {colors.accent.primary}",
    },
    "[data-scope='card']": {
      borderWidth: "1px",
      borderColor: "{colors.border.default}",
      background: "{colors.bg.surface}",
    },
    "th, td": {
      borderColor: "{colors.border.default}",
    },
    thead: {
      background: "{colors.bg.muted}",
    },
    th: {
      color: "{colors.text.muted}",
      fontWeight: "600",
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    td: {
      color: "{colors.text.primary}",
    },
    "tbody tr:hover": {
      background: "rgba(255, 255, 255, 0.02)",
    },
    "[data-scope='button']": {
      fontWeight: "600",
      letterSpacing: "0.01em",
      borderRadius: "0.625rem",
    },
    "[data-scope='button'][data-variant='outline']": {
      color: "{colors.text.primary}",
      borderColor: "{colors.border.default}",
      background: "{colors.bg.muted}",
    },
    "[data-scope='button'][data-variant='outline']:hover": {
      background: "{colors.bg.subtle}",
      borderColor: "{colors.accent.primary}",
      color: "{colors.text.primary}",
    },
    "[data-scope='button'][data-variant='subtle']": {
      color: "{colors.text.primary}",
      background: "{colors.bg.subtle}",
    },
    "[data-scope='button'][data-variant='subtle']:hover": {
      background: "{colors.accent.surface}",
      color: "{colors.text.primary}",
    },
    "[data-scope='button'][data-variant='solid']": {
      color: "#0e1117",
      boxShadow: "0 8px 22px rgba(0, 0, 0, 0.35)",
    },
    "[data-scope='button'][data-variant='solid']:hover": {
      color: "#0e1117",
      filter: "brightness(0.98)",
    },
    "[data-scope='button'][data-disabled]": {
      opacity: "0.62",
    },
    "*:focus-visible": {
      outline: "2px solid",
      outlineColor: "{colors.accent.primary}",
      outlineOffset: "2px",
    },
  },
});
