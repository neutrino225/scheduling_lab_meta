# Meta Lab UI Design Specification
## The Publishing Desk: Professional, High-Density Social Media Scheduling

### Design Philosophy
- **"The Publishing Desk"**: An aesthetic inspired by professional newsrooms and high-end physical equipment. High information density, clear status indicators, and a focus on content as the primary artifact.
- **Atmospheric Utility**: Interfaces should feel tool-like and robust but aesthetically pleasing through typography and layout rather than decoration.
- **Desktop-First Optimization**: While responsive, the primary experience is optimized for a wide-screen "command center" view.

---

## Design Tokens

### Color Palette
- **Background**: `#FAFAFA` (Off-white, light mode)
- **Surface**: `#FFFFFF` (Cards, panels)
- **Surface Subtle**: `#F3F4F6` (Input backgrounds)
- **Text Primary**: `#0F172A` (Rich slate black)
- **Text Secondary**: `#4B5563` (Muted gray)
- **Text Muted**: `#9CA3AF` (De-emphasized metadata)
- **Accent Primary**: `#0F172A` (Black for primary actions, creates a sharp look)
- **Accent Success**: `#10B981` (Status: Published)
- **Accent Danger**: `#EF4444` (Status: Failed)
- **Border Default**: `#E5E7EB`
- **Border Focus**: `#0F172A` (Sharp black focus rings)

### Typography
- **Headings**: `Space Grotesk`, sans-serif (600+ weight)
- **Body/UI**: `Manrope`, sans-serif (400-500 weight)
- **Monospace**: `JetBrains Mono` (IDs, timestamps, system logs)

### Spacing & Layout
- **Grid**: 1.5rem (24px) base gutter
- **Radius**: 8px standard for cards/inputs, 9999px for pills
- **Shadow**: `0 1px 2px rgba(0,0,0,0.05)` (Extremely subtle, almost flat)

---

## Core Screens

### 1. Login Experience
**Route**: `/login`
**Layout**: Split-pane (60/40) on desktop.
- **Left (Branding)**: High-quality atmospheric imagery (e.g., Unsplash 'office', 'dark', 'setup') with overlay text.
- **Right (Form)**: Clean, centered vertical stack. Minimal inputs with clear labels.

### 2. The Publishing Desk (New Post)
**Route**: `/posts/new`
**Layout**: Multi-column grid.
- **Primary Column**: Form fields (Platform, Account, Caption, Media, Schedule).
- **Secondary Column**: Sticky Live Preview (Facebook/Instagram mocks).
- **Visuals**: Inputs use `Surface Subtle` backgrounds with 1px borders.

### 3. Media Upload & Gallery
- **Auto-Upload**: Files upload immediately upon selection with real-time progress.
- **Media Cards**: Compact horizontal cards showing thumbnails, filename, and type.
- **Validation**: Instagram requires media; validation is surfaced near the submit action.

---

## UI Primitives

### Button
- **Primary**: Solid `#0F172A`, white text. No gradient. Sharp hover state.
- **Secondary**: Transparent background, 1px border.

### Inputs (Input, Select, Textarea, Date/Time)
- **Background**: `var(--bg-subtle)`
- **Border**: 1px solid `var(--border-default)`
- **Typography**: Manrope 0.9375rem
- **Focus**: `var(--accent-primary)` border + 1px shadow.

### FileUpload
- Drag & Drop zone with dashed border.
- Integrated upload progress bar.
- Supports Image/Video filtering.

---

## Interactions
- **Transitions**: 150ms ease-in-out for all hover states.
- **Sticky Elements**: Previews and summary cards stay visible while scrolling long forms.
- **Real-time Feedback**: Preview updates instantly on input change.

---

## Technical Implementation
- **Base Components**: Custom React primitives in `@/components/primitives/`.
- **CSS**: CSS-in-JS (via `style` props for dynamic values) + Global CSS in `@/app/components.css` for layout/hover states.
- **Fonts**: Loaded via `next/font/google`.
