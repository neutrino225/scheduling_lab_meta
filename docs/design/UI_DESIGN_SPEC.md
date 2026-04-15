# Meta Lab UI Design Specification
## Minimal, Aesthetic, and UX-Friendly Social Media Scheduler

### Design Philosophy
- **Minimalism**: Clean lines, maximum whitespace, no decoration without purpose
- **Aesthetic**: Modern, professional, typography-driven with carefully chosen color palette
- **UX-First**: Every interaction should feel intentional; reduce cognitive load; guide users naturally

---

## Color Palette

### Primary
- **Background**: `#FAFAFA` (off-white, reduces eye strain)
- **Surface**: `#FFFFFF` (cards, modals, sections)
- **Text Primary**: `#1A1A1A` (near-black, high contrast)
- **Text Secondary**: `#666666` (muted, for hints/metadata)

### Accent
- **Action**: `#0066CC` (vibrant blue, call-to-action)
- **Success**: `#00AA44` (status: published)
- **Warning**: `#FF9900` (status: scheduled/pending)
- **Error**: `#CC0000` (status: failed, destructive)

### Borders & Dividers
- **Light Divider**: `#E8E8E8`
- **Focus Ring**: `#0066CC` (2px solid)

---

## Typography

### Font Stack
```
Headings: "Inter" or system sans-serif (600 weight, letter-spacing -0.01em)
Body: "Inter" or system sans-serif (400 weight, 1.5 line-height)
Monospace: "SF Mono" or system mono (for IDs, timestamps)
```

### Sizes
- **H1 (Page Title)**: 32px / 1.25em
- **H2 (Section Header)**: 24px / 1.1em
- **H3 (Subsection)**: 16px / 1em (600 weight)
- **Body**: 14px / 1.5em
- **Caption**: 12px / 1.4em (secondary text)

---

## Core Screens

### 1. **Login Screen**
**Route**: `/login` (default entry point)

**Layout**:
- Full viewport, centered card
- No background image; use `#FAFAFA` background
- Single column, max-width 400px

**Elements**:
```
┌─────────────────────────────────┐
│                                 │
│   Meta Lab                      │
│   Schedule posts to Meta        │
│   (subtitle, 12px)              │
│                                 │
│   ┌──────────────────────────┐  │
│   │ Email or Username        │  │
│   │ [input field, no border] │  │
│   └──────────────────────────┘  │
│   (hint: "Enter your account")  │
│                                 │
│   ┌──────────────────────────┐  │
│   │ Password                 │  │
│   │ [input field, no border] │  │
│   └──────────────────────────┘  │
│   (hint: "8+ characters")       │
│                                 │
│   ☐ Remember me                 │
│                                 │
│   ┌──────────────────────────┐  │
│   │ Sign In                  │  │ (blue bg)
│   │                          │  │
│   └──────────────────────────┘  │
│                                 │
│   Don't have an account?        │
│   Create one (link, blue)       │
│                                 │
└─────────────────────────────────┘
```

**Details**:
- Inputs: white background, `#E8E8E8` bottom border only (2px on focus)
- Button: full width, 44px height (touch-friendly)
- "Remember me": simple checkbox, no label box
- Links: `#0066CC`, no underline (underline on hover)

---

### 2. **Signup Screen**
**Route**: `/signup`

**Layout**: Same as login, but 2-column form for name/email

**Elements**:
```
┌─────────────────────────────────┐
│  Create Your Account            │
│  (subtitle: 12px secondary)     │
│                                 │
│  ┌──────────┐ ┌──────────────┐  │
│  │ First    │ │ Last         │  │
│  │ Name     │ │ Name         │  │
│  └──────────┘ └──────────────┘  │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Email                    │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Password (8+ chars)      │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Confirm Password         │   │
│  └──────────────────────────┘   │
│                                 │
│  ☐ I agree to Terms of Service  │
│                                 │
│  ┌──────────────────────────┐   │
│  │ Create Account           │   │
│  └──────────────────────────┘   │
│                                 │
│  Already have an account?       │
│  Sign In (link)                 │
│                                 │
└─────────────────────────────────┘
```

**Details**:
- All inputs bottom-border only
- Error states: border becomes `#CC0000`, error message below in red
- Password strength indicator: simple bar (gray → yellow → green)

---

### 3. **Dashboard / Posts List**
**Route**: `/dashboard` (main page after login)

**Layout**:
- Header: fixed top, white bg, subtle shadow
- Sidebar: collapsible, left side (or hidden on mobile)
- Main content: full width with padding

**Header**:
```
┌────────────────────────────────────────────────┐
│ ≡  Meta Lab                    [Search] [+Post] │  Search: 300px input
│                                                 │  + Post: blue button, 44px
└────────────────────────────────────────────────┘
```

**Sidebar** (optional, collapsible):
```
┌──────────────┐
│ Dashboard    │ (current, bold)
│ Scheduled    │
│ Published    │
│ Failed       │
│ Accounts     │
│ Settings     │
│ Logout       │
└──────────────┘
```

**Main Content - Posts Grid**:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Filters: [Status ▼] [Platform ▼] [Date Range ▼]   │
│                                                     │
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │ [Image or video]   │  │ [Image or video]   │    │
│  │                    │  │                    │    │
│  │ "Caption text..."  │  │ "Caption text..."  │    │
│  │ 2 media  Draft     │  │ 1 media  Scheduled │    │
│  │ Jan 15, 2pm        │  │ Jan 20, 3pm        │    │
│  │ [Edit] [Delete]    │  │ [Edit] [Delete]    │    │
│  └────────────────────┘  └────────────────────┘    │
│                                                     │
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │ [Image or video]   │  │ [Image or video]   │    │
│  │                    │  │                    │    │
│  │ "Caption text..."  │  │ "Caption text..."  │    │
│  │ 3 media  Published │  │ Failed             │    │
│  │ Jan 10, 8am        │  │ Jan 8, 5pm         │    │
│  │ [View] [Duplicate] │  │ [Retry] [Delete]   │    │
│  └────────────────────┘  └────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Post Card Details**:
- **Size**: 240px × 280px (fits 2-3 per row on desktop)
- **Image**: 240px × 140px, cover mode, rounded corners (4px)
- **Caption**: 2 lines max, truncate with ellipsis
- **Meta**: Media count, status badge (small pill), scheduled time
- **Actions**: Two buttons (Edit, Delete) or (View, Duplicate) based on status
  - Buttons: text-only, hover reveals background
  - Status badge: colored pill, 10px padding, 4px border-radius

---

### 4. **Create/Edit Post Screen**
**Route**: `/posts/new` or `/posts/[id]/edit`

**Layout**:
- Sidebar form (40% width on desktop) + preview (60%)
- On mobile: stacked, preview above form

**Sidebar Form**:
```
┌────────────────────────────────────┐
│ Create Post                        │
│ ╳ (close button, top right)        │
│                                    │
│ Select Account*                    │
│ [Dropdown: Facebook Page ▼]        │
│ Hint: "Post to this account"      │
│                                    │
│ Select Platform*                   │
│ ☉ Facebook   ☉ Instagram          │
│                                    │
│ Caption                            │
│ ┌────────────────────────────────┐ │
│ │ [textarea, 500 char limit]     │ │
│ │                                │ │
│ │                                │ │
│ │ [300/500 chars]                │ │
│ └────────────────────────────────┘ │
│                                    │
│ Media                              │
│ ┌────────────────────────────────┐ │
│ │ [+ Add Image/Video]            │ │
│ │ Drag & drop or click           │ │
│ │ Max 10 files, 50MB each        │ │
│ └────────────────────────────────┘ │
│                                    │
│ Media List:                        │
│ • photo_1.jpg (2MB)  [✕]          │
│ • video_2.mp4 (18MB) [↑↓]         │
│                                    │
│ Schedule Post                      │
│ ☐ Post now                         │
│ ☑ Schedule for later              │
│                                    │
│ [Calendar icon] Jan 20, 2025      │
│ [Clock icon] 2:30 PM              │
│                                    │
│ [Cancel] [Save as Draft] [Publish]│
│                                    │
└────────────────────────────────────┘
```

**Right Side - Live Preview**:
```
┌────────────────────────────────┐
│ Live Preview                   │
│                                │
│ (Platform selected badge)      │
│ FACEBOOK PAGE                  │
│                                │
│ ┌──────────────────────────┐   │
│ │                          │   │
│ │ (Media preview here)     │   │
│ │ (carousel if multiple)   │   │
│ │                          │   │
│ └──────────────────────────┘   │
│                                │
│ Your Test Page                 │
│ "Caption preview shows         │
│  here, styled as it will       │
│  appear on platform"           │
│                                │
│ 👍 Like  💬 Comment  ↗ Share   │
│                                │
└────────────────────────────────┘
```

**Details**:
- Account selector: dropdown with platform color indicator
- Media upload: drag-drop zone with dashed border
- Media list: reorderable with up/down arrows, remove icon
- Schedule section: conditional, shows date/time pickers
- Buttons: disabled if form invalid, hover states clear

---

### 5. **Accounts Management**
**Route**: `/accounts`

**Layout**:
```
┌─────────────────────────────────────────┐
│ Connected Accounts                      │
│                          [+ Add Account]│
│                                         │
│ ┌──────────────────────────────────┐   │
│ │ 🟦 Facebook                      │   │
│ │                                  │   │
│ │ My Business Page                 │   │
│ │ ID: page_12345678                │   │
│ │ Token expires: Mar 15, 2025      │   │
│ │                                  │   │
│ │ [Edit] [Refresh Token] [Remove]  │   │
│ └──────────────────────────────────┘   │
│                                         │
│ ┌──────────────────────────────────┐   │
│ │ 🟪 Instagram                     │   │
│ │                                  │   │
│ │ @mybusiness                      │   │
│ │ ID: user_987654321               │   │
│ │ Token expires: Mar 15, 2025      │   │
│ │                                  │   │
│ │ [Edit] [Refresh Token] [Remove]  │   │
│ └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Add Account Flow**:
- Button opens modal with OAuth flow
- Shows platform selection (Facebook / Instagram)
- "Connect with [Platform]" button (official brand colors)
- After auth: shows account details confirmation, [Confirm] [Cancel]

---

### 6. **Settings**
**Route**: `/settings`

**Layout**:
```
┌────────────────────────────────────────┐
│ Settings                               │
│                                        │
│ Profile                                │
│ ┌──────────────────────────────────┐   │
│ │ [Avatar] First Name              │   │
│ │         [Text input]              │   │
│ │         Last Name                │   │
│ │         [Text input]              │   │
│ │         Email                    │   │
│ │         user@example.com (view)  │   │
│ │         [Save]                   │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Preferences                            │
│ ┌──────────────────────────────────┐   │
│ │ ☑ Email notifications on failure │   │
│ │ ☐ Email digest (daily)           │   │
│ │ ☑ Timezone: America/New_York     │   │
│ │   (auto-detected, editable)      │   │
│ │ [Save]                           │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Security                               │
│ ┌──────────────────────────────────┐   │
│ │ Change Password                  │   │
│ │ [Button → modal]                 │   │
│ │                                  │   │
│ │ Active Sessions                  │   │
│ │ • This device, Jan 15 2:45pm     │   │
│ │ • iPhone, Jan 14 9:30am [Revoke] │   │
│ │ [Sign out all devices]           │   │
│ │                                  │   │
│ │ [Save]                           │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Danger Zone                            │
│ ┌──────────────────────────────────┐   │
│ │ Delete Account                   │   │
│ │ [Red button → confirmation]      │   │
│ └──────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

---

## Interaction Patterns

### Modals
- **Overlay**: Semi-transparent black (`rgba(0,0,0,0.3)`)
- **Card**: White, shadow `0 20px 40px rgba(0,0,0,0.15)`, max-width 500px
- **Header**: Bold title, close button (╳) right-aligned
- **Actions**: Right-aligned, [Cancel] [Primary Action]
- **Animation**: Fade in 200ms, scale from center

### Dropdowns & Selects
- **Trigger**: White background, `#E8E8E8` border, dropdown arrow
- **Menu**: White background, shadow, appears below trigger
- **Items**: 44px height (touch-friendly), hover: light gray background
- **Keyboard**: Arrow keys navigate, Enter selects, Escape closes

### Toasts / Notifications
- **Position**: Bottom-right, 12px margin
- **Style**: White card, shadow, icon + text
- **Success**: Green icon, auto-dismiss 4s
- **Error**: Red icon, requires action (dismiss button)
- **Info**: Blue icon, auto-dismiss 6s
- **Animation**: Slide up 200ms

### Loading States
- **Spinner**: Animated circle, `#0066CC`
- **Skeleton**: Light gray pulsing boxes matching content shape
- **Disabled buttons**: Opacity 0.5, no hover effect

### Empty States
```
┌─────────────────────────────────┐
│                                 │
│   (Empty icon illustration)     │
│                                 │
│   No Posts Yet                  │
│   Create your first scheduled   │
│   post to get started.          │
│                                 │
│   [+ Create Post] (blue button) │
│                                 │
└─────────────────────────────────┘
```

---

## Responsive Behavior

### Breakpoints
- **Mobile**: < 640px
  - Single column, full width
  - Sidebar collapses to hamburger
  - Post cards: 1 per row
  - Modals: full screen

- **Tablet**: 640px - 1024px
  - 2-column layout when applicable
  - Post cards: 2 per row
  - Sidebar visible but narrower

- **Desktop**: > 1024px
  - Full multi-column layout
  - Post cards: 3 per row
  - Sidebar always visible

### Touch Targets
- Minimum 44px × 44px for all interactive elements
- Larger spacing on mobile (16px) vs desktop (8px)

---

## Accessibility

### WCAG 2.1 AA Compliance
- **Color contrast**: 4.5:1 for text, 3:1 for graphics
- **Focus indicators**: 2px solid blue border, visible on all inputs
- **Alt text**: All images have descriptive alt text
- **Form labels**: Every input has associated label (visible or aria-label)
- **Keyboard navigation**: All features accessible via Tab + Enter

### Screen Reader Support
- Semantic HTML (`<button>`, `<form>`, `<nav>`)
- ARIA landmarks for regions
- Error messages associated with form fields (`aria-describedby`)
- Loading states announced (`role="status"`)

---

## Component Library (Reusable)

### Button Variants
```
Primary: bg-blue, white text, 44px height, 8px padding
Secondary: white bg, blue text, border
Danger: bg-red, white text
Ghost: transparent, colored text
Icon: circular, 40px × 40px
Disabled: opacity 0.5
```

### Input Variants
```
Text, Email, Password, Textarea
- White bg, bottom border only (2px on focus)
- Placeholder: light gray
- Error: red border, error text below
- Label: bold, 12px above
- Hint: secondary gray, below label
```

### Badge / Status Pill
```
Draft: gray background
Scheduled: yellow background  
Published: green background
Failed: red background
- 4px border-radius, 10px padding, small font
```

### Card
```
White background, subtle shadow, 8px padding
Hover: shadow increases slightly
```

---

## Animation & Transitions

- **Page transitions**: Fade in 150ms (no slide)
- **Button hover**: Background color change 100ms
- **Dropdown open**: Slide down 200ms, ease-out
- **Loading spinner**: Rotate 2s linear infinite
- **Success checkmark**: Scale + fade in 300ms, ease-out

---

## Error Handling

### Form Validation (Real-time)
- **On blur**: Validate field, show error if invalid
- **On input**: Clear error message as user corrects
- **On submit**: Highlight all invalid fields, prevent submission

### API Errors
```
Generic Error Toast:
"Something went wrong. Please try again."
[Retry]

Specific Error Toast:
"Email already in use. Please log in or use another email."
[OK]
```

### Network State
- **No connection**: Banner at top, "Connection lost. Retrying..."
- **Request timeout**: "Request timed out. [Retry]"
- **Server error**: "Server error. [Report] [Contact Support]"

---

## Dark Mode (Future)

- Background: `#1A1A1A`
- Surface: `#2A2A2A`
- Text: `#F0F0F0`
- Accent: `#4499FF` (lighter blue)

---

## Implementation Notes

### CSS Framework
- **Tailwind CSS** (recommended) or vanilla CSS Grid/Flexbox
- Design tokens stored in CSS variables for consistency
- Mobile-first approach

### State Management
- React Context or Zustand for global state
- Local state for component-level UI (modal open, form focus, etc.)

### API Integration
- All endpoints defined in AGENTS.md are used
- Loading, error, and empty states handled per screen
- Optimistic updates for post creation/editing

### Performance
- Code splitting by route
- Image optimization (lazy loading, responsive sizes)
- No heavy animations on smaller devices

---

## Keyboard Shortcuts (Future Enhancement)

```
Ctrl/Cmd + K: Open command palette / search
Ctrl/Cmd + N: New post
Ctrl/Cmd + S: Save draft
Escape: Close modal / cancel
? : Show help
```

---

## Success Metrics

- **Time to create post**: < 2 minutes
- **Discoverability**: No feature buried > 3 clicks from home
- **Error recovery**: Users can recover from any error without page reload
- **Accessibility**: 100% keyboard navigable, 0 WCAG violations

---

## Summary

This design balances **minimalism** (clean layout, whitespace, no distractions) with **aesthetics** (modern typography, subtle colors, polished interactions) while prioritizing **UX** (clear hierarchy, large touch targets, immediate feedback, error prevention).

All screens follow a consistent grid, color system, and interaction model, making the entire app feel cohesive and intuitive.
