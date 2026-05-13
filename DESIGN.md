---
name: Meta Lab
description: Self-hosted social media scheduling dashboard
colors:
  canvas: "#070709"
  surface: "#0f1013"
  subtle: "#17191f"
  muted-bg: "#12141a"
  text-primary: "#f4f5f7"
  text-muted: "#a5aab5"
  text-subtle: "#858b97"
  border-default: "#272a32"
  accent-primary: "#d9dee8"
  accent-surface: "#1d212a"
  accent-text: "#f4f5f7"
  status-success: "#188a5b"
  status-warning: "#c8841f"
  status-danger: "#c9483a"
  status-info: "#2f7dbf"
  success-surface: "rgba(24, 138, 91, 0.16)"
  warning-surface: "rgba(200, 132, 31, 0.16)"
  danger-surface: "rgba(201, 72, 58, 0.16)"
  info-surface: "rgba(47, 125, 191, 0.16)"
  brand-50: "#f8f9fb"
  brand-100: "#f1f3f7"
  brand-200: "#e7ebf2"
  brand-300: "#d9dee8"
  brand-400: "#c4ccda"
  brand-500: "#aab4c5"
  brand-600: "#80899a"
  brand-700: "#5f6775"
  brand-800: "#3e4450"
  brand-900: "#232730"
  neutral-50: "#f0f4fb"
  neutral-100: "#d6deea"
  neutral-200: "#b8c3d4"
  neutral-300: "#98a5b9"
  neutral-400: "#7d899c"
  neutral-500: "#646f83"
  neutral-600: "#4b5567"
  neutral-700: "#353d4c"
  neutral-800: "#232a36"
  neutral-900: "#161c26"
  neutral-950: "#0c1119"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  card: "14px"
  button: "10px"
  badge: "6px"
  input: "8px"
  nav: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-300}"
    textColor: "#0e1117"
    rounded: "{rounded.button}"
    height: "38px"
  button-outline:
    backgroundColor: "{colors.muted-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.button}"
    borderColor: "{colors.border-default}"
    height: "38px"
  button-subtle:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.button}"
    height: "38px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "24px"
  input:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.input}"
    borderColor: "{colors.border-default}"
  sidebar-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.nav}"
    padding: "6px 12px"
  sidebar-nav-active:
    backgroundColor: "{colors.accent-surface}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.nav}"
    borderColor: "{colors.accent-primary}"
    padding: "6px 12px"
---

# Design System: Meta Lab

## 1. Overview

**Creative North Star: "The Publishing Desk"**

Meta Lab is a publishing desk for a single operator: a clean, dark surface where content arrives,
gets scheduled, and departs. Every element that doesn't carry post metadata is excess. The
interface is a terminal-quality GUI — high information density, no decorative flourishes, every
pixel earning its place.

This system explicitly rejects Generic SaaS Cream: no pastel gradients, round illustration
masks, hero-metric templates, or "modern" dataviz ornament. The aesthetic is editorial and
sparse. Think a darkroom crossed with a flight deck: precise controls, meaningful status
lights, and nothing else.

Currently dark-mode only. Light mode is a future concern and must not compromise dark quality.

**Key Characteristics:**
- Content-forward: posts, status, and schedules own the interface
- Status at a glance: color + shape signals before text
- Tonal surfaces layered by lightness (canvas → surface → subtle)
- Panel shadow (0 16px 42px) for containers that need to float
- Tight typography stack with clear hierarchy

## 2. Colors

Dark palette anchored on a near-black canvas with warm-tinted surfaces. The single accent
(brand.300, a cool silver) is restrained to active navigation states and focus rings —
never decorative.

### Primary (Neutral)
- **Canvas** (#070709): The deepest background. Page-level void. Used on body and main layout areas.
- **Surface** (#0f1013): Card and panel backgrounds. One step above canvas.
- **Subtle** (#17191f): Input fields, hover states, secondary surfaces.
- **Muted BG** (#12141a): Table headers, subtle button variant backgrounds.

### Neutral Text & Borders
- **Text Primary** (#f4f5f7): All body content and headings.
- **Text Muted** (#a5aab5): Secondary information, placeholders, table headers.
- **Text Subtle** (#858b97): Tertiary information, captions.
- **Border Default** (#272a32): All structural borders — cards, table rows, inputs, dividers.

### Accent
- **Accent Primary** (#d9dee8 / brand.300): Active nav items, focus rings, hover borders. Used
  sparingly — its rarity is the point.
- **Accent Surface** (#1d212a): Active nav item background.

### Status
- **Success** (#188a5b): Published posts, completed jobs. Surface variant at 16% opacity.
- **Warning** (#c8841f): Processing/running states. Surface variant at 16% opacity.
- **Danger** (#c9483a): Failed posts, errors, logout button. Surface variant at 16% opacity.
- **Info** (#2f7dbf): Scheduled/pending states. Surface variant at 16% opacity.

### Brand Scale
Full brand ramp 50–900 (cool gray-blue) and neutral ramp 50–950 (cool dark blue-gray).
Brand.300 matches the accent primary. Higher brand stops approach near-black.

### Named Rules
**The Rarity Rule.** The accent primary (brand.300) appears on ≤5% of any surface. Its
application is limited to active navigation, focus rings, and border hover states. Never
decorative, never repeated.

**The Status Light Rule.** Status colors always appear in pairs: a solid text/icon color and a
matching background at 16% opacity. The background gives the color presence at small sizes;
the pair ensures badges and labels are legible without white text on saturated color.

## 3. Typography

**Display / Headline Font:** Space Grotesk (with sans-serif fallback)
**Body Font:** Manrope (with sans-serif fallback)
**Mono Font:** IBM Plex Mono (400, 500 weights, with monospace fallback)

**Character:** A geometric-sans display paired with a warm humanist sans body. Space Grotesk
brings a technical, slightly editorial precision to headings. Manrope is compact and readable
at small sizes — critical for a data-dense dashboard. IBM Plex Mono grounds IDs, timestamps,
and technical data in an authoritative fixed-width face.

### Hierarchy
- **Display** (Space Grotesk 600, 1.875rem/30px, 1.2): Dashboard metric values, page titles.
- **Headline** (Space Grotesk 600, 1.5rem/24px, 1.3): Card headers, section titles.
- **Title** (Space Grotesk 600, 1.125rem/18px, 1.4): Sub-headers, navigation heading.
- **Body** (Manrope 400, 1rem/16px, 1.45): Post captions, form labels, table cells. Max line
  length 65–75ch where wrapped.
- **Label** (Manrope 500, 0.875rem/14px, 1.4): Button text, filter labels, field labels.
- **Mono** (IBM Plex Mono 400, 0.75rem/12px): IDs, tokens, timestamps, technical data.

### Named Rules
**The Table Header Rule.** All table column headers are uppercase, 0.75rem, letter-spacing
0.08em, in text-muted color. This creates a consistent, scannable data grid rhythm across
every page.

## 4. Elevation

Shadow-driven depth with tonal layering as a secondary signal. Primary containers (cards,
panels) float above the canvas using the panel shadow. Within containers, tonal surface steps
(canvas → surface → subtle → muted-bg) convey containment without additional shadow.

### Shadow Vocabulary
- **Panel** (`0 16px 42px rgba(0, 0, 0, 0.36)`): Cards, dropdowns, elevated containers. Creates
  a clean hover/separation effect against the near-black canvas.

### Named Rules
**The No-Border-Stack Rule.** Never stack a shadowed card on top of another shadowed card.
Containment within a shadowed card is expressed via tonal surface change (subtle/muted-bg),
not by adding a second shadow.

## 5. Components

### Buttons
- **Shape:** Gently curved edges (10px radius).
- **Primary:** Light text on dark surface inverted — brand.300 background, near-black text
  (solid variant, `#0e1117`). Used for primary actions (Create, Login).
- **Outline:** Muted background with border. Used for secondary actions (Logout with danger
  accent). Hover shifts border to accent primary.
- **Subtle:** Surface-toned background, no border. Used for tertiary actions (Reset filters).
  Hover shifts to accent surface.
- **States:** Focus-visible gets 2px solid accent primary outline + 2px offset. Disabled state
  drops to 62% opacity. Transitions are instant — no hover delay.
- **Typography:** Label size (0.875rem), font-weight 600, letter-spacing 0.01em.

### Cards / Containers
- **Corner Style:** Curved edges (14px radius).
- **Background:** Surface (#0f1013).
- **Shadow:** Panel shadow (0 16px 42px).
- **Border:** 1px solid border.default (#272a32).
- **Internal Padding:** 24px (Card.Body), 16px 24px (Card.Header).
- **Card Header:** Headline-size heading inside, subtitle in text-muted below.

### Inputs & Fields
- **Style:** Subtle background (#17191f), border.default stroke (1px), curved corners (8px).
- **Focus:** Border shifts to accent primary + 1px box-shadow ring. Focus-visible outline via
  global 2px accent primary outline.
- **Hover:** Border shifts to accent primary.
- **Typography:** Body-size (1rem) text-primary inside, label-size labels above.
- **Disabled / Error:** Disabled at 62% opacity. Error uses danger status color on
  border + text.

### Navigation (Sidebar)
- **Style:** Vertical left sidebar (260px), surface background, right-border separator.
- **Typography:** Label-size (0.875rem), font-weight 500 (600 when active).
- **States:**
  - **Default:** Transparent background, text-primary, no border.
  - **Hover:** Subtle background (#17191f), border.default appears.
  - **Active:** Accent surface background (#1d212a), accent primary left border emphasis,
    accent text color.
- **Mobile:** Collapses to horizontal top bar.

### Badges / Status Indicators
- **Shape:** Compact pill (6px radius).
- **Typography:** Label-size (0.875rem), font-weight 600, text-transform none.
- **Color Pairs:** Each status badge uses a matching status color + its 16% opacity surface
  variant as background. Success/green, warning/yellow, danger/red, info/blue.

### Tables
- **Header Row:** Muted background (#12141a). Column headers are uppercase, 0.75rem, 0.08em
  letter-spacing, text-muted color.
- **Body Rows:** No background. Hover adds a subtle white overlay (rgba(255,255,255,0.02)).
- **Cells:** Body-size (1rem) text-primary for values, mono (0.75rem) for IDs and technical
  data.
- **Borders:** 1px border.default between rows and columns.

### Header / Top Bar
- **Style:** Sticky top bar, surface background, blur(8px) backdrop-filter, bottom border.
- **Content:** Breadcrumb/subtitle on left, Logout button on right.
- **Height:** 64px (16).
- **Z-index:** 40 (appBar).

## 6. Do's and Don'ts

### Do:
- **Do**  use tonal surface steps (canvas → surface → subtle → muted-bg) for containment.
- **Do**  apply status colors only as paired text + 16% opacity background — never solid
  backgrounds on badges.
- **Do**  keep status badges compact (6px radius, 0.875rem, font-weight 600).
- **Do**  use mono font for IDs, tokens, timestamps, and any machine-readable data.
- **Do**  reserve accent primary for active states, focus rings, and hover borders only.
- **Do**  use the panel shadow (0 16px 42px) for cards and elevated containers.
- **Do**  keep the sidebar at 260px and use vertical navigation on desktop.
- **Do**  use Space Grotesk for all headings and Manrope for body.
- **Do**  uppercase table column headers with wide letter-spacing.

### Don't:
- **Don't** use pastel gradients, glassmorphism, gradient text, or side-stripe borders. These
  are explicitly forbidden per PRODUCT.md's anti-references (Generic SaaS Cream).
- **Don't** nest cards inside cards. Use tonal surface change instead of nested Card.Root.
- **Don't** apply the accent primary decoratively. Its rarity is the point.
- **Don't** use cards when a flat table row or list item suffices. Cards are for grouped
  metadata, not individual posts.
- **Don't** stack shadowed containers. One shadow per depth layer.
- **Don't** wrap everything in a container. Most things don't need one.
- **Don't** add em dashes. Use commas, colons, or periods.
- **Don't** use modals as a first solution. Exhaust inline / progressive alternatives first.
- **Don't** animate CSS layout properties. Use ease-out-quart/expo curves. No bounce.
