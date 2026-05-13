# Impeccable — Meta Lab Design Reference

## Scene

Single operator sitting at a dimly lit desk at night, scheduling tomorrow's social posts across 9+
Facebook pages. Wants clarity, speed, and calm. The tool disappears — the work is the focus.

Dark mode primary. Light mode for daytime/projector use.

---

## Design System (Already in Place)

### Tech
- **Chakra UI v3** (`@chakra-ui/react ^3.34.0`)
- **Tailwind CSS v4** (globals only)
- **Fonts**: Space Grotesk (headings), Manrope (body), IBM Plex Mono (mono)
- **Theme**: `theme/tokens.ts` with `createSystem(defaultConfig, appConfig)`

### Current Tokens
- Canvas: `#070709` → `#f4f5f7` (light to be designed)
- Surfaces: `#0f1013` / `#17191f`
- Text: `#f4f5f7` primary, `#a5aab5` muted
- Border: `#272a32`
- Accent: brand.300 (`#d9dee8`)
- Semantic colors: bg.canvas, bg.surface, bg.subtle, text.primary, text.muted, border.default, accent.primary, status.\*

### Commands

| Command | When to use |
|---|---|
| `craft [page/feature]` | Build a new page or feature end-to-end (shape, then implement) |
| `shape [page/feature]` | Plan UX/UI before writing code — wireframes, flows, layout |
| `teach` | First-time setup or update: creates/rewrites PRODUCT.md + DESIGN.md |
| `document` | Generate DESIGN.md from existing code (extracts tokens, components) |
| `extract [target]` | Pull reusable patterns into the design system (tokens, components) |
| `critique [page]` | UX design review — heuristic scoring, flow analysis |
| `audit [page]` | Technical quality: a11y, perf, responsive, color contrast, edge cases |
| `polish [page]` | Final quality pass before shipping — micro-interactions, alignment, rhythm |
| `bolder [page]` | Amplify safe or bland designs — more contrast, bigger scale, stronger hierarchy |
| `quieter [page]` | Tone down overstimulating designs — reduce chroma, spacing, noise |
| `distill [page]` | Strip to essence — remove unnecessary cards, containers, chrome |
| `harden [target]` | Production-ready — error states, loading skeletons, i18n, edge cases, empty states |
| `onboard [target]` | Design first-run flows, empty states, activation, tooltips |
| `animate [target]` | Add purposeful motion — transitions, micro-interactions, page load |
| `colorize [target]` | Add strategic color to monochromatic UIs — accent roles, data viz |
| `typeset [target]` | Fix typography hierarchy, size scale, line length, font choices |
| `layout [target]` | Fix spacing rhythm, alignment, visual hierarchy, responsive breakpoints |
| `delight [target]` | Add personality — subtle touches, hover effects, status transitions |
| `overdrive [target]` | Push past conventional limits — ambitious visual effects, experimental |
| `clarify [target]` | Fix UX copy — labels, error messages, empty states, tooltips |
| `adapt [target]` | Make responsive — mobile, tablet, wide desktop, touch targets |
| `optimize [target]` | Diagnose and fix UI performance — re-renders, layout thrash, bundle |
| `live` | Visual variant mode — pick elements in browser, generate alternatives |

### Invocation
```
impeccable <command> [target]
```

### Design Laws

1. **Dark-first, light-supported** — the tool is used at night. Light mode is a secondary concern but must not be an afterthought.
2. **Content-forward** — social posts are the hero. Chrome recedes. Tables, lists, and previews dominate.
3. **Status at a glance** — scheduled / published / failed must be instantly distinguishable via color + shape, not just text.
4. **No cards unless better** — the app currently overuses `Card.Root`. Replace with slim rows, flat lists, or direct content where appropriate.
5. **One operator, no hand-holding** — this is a power tool. No onboarding tours, no tooltip spam. Keyboard shortcuts welcome.
6. **Dark theme rules**: use OKLCH, tint neutrals toward brand hue (chroma 0.005–0.01), avoid `#000`/`#fff`, never use gradient text or glassmorphism as default.
7. **Typography**: Manrope body at 65–75ch max, Space Grotesk headings with ≥1.25 scale ratio, IBM Plex Mono for IDs and timestamps.
8. **Motion**: don't animate layout properties. Use ease-out-quart/expo. No bounce, no elastic.
9. **Absolute bans**: side-stripe borders, gradient text, glassmorphism as default, hero-metric template, identical card grids, modal as first thought.
10. **Status colors**: success (`#188a5b`), warning (`#c8841f`), danger (`#c9483a`), info (`#2f7dbf`) — each with a 16% opacity surface variant.

### Current Pages
| Route | Page | Status |
|---|---|---|
| `/` | Dashboard — stat cards + upcoming posts + recent jobs | Built |
| `/login` | Login — username/password + Facebook Login | Built |
| `/posts` | Post list — filterable table | Built |
| `/posts/new` | Create Post — form with account/platform/caption/schedule/media | Built |
| `/jobs` | Jobs — summary cards + filterable table | Built |
| `/accounts` | Account list — table showing connected pages | Built |
| `/media` | Media gallery — card grid (static) | Built |
| `/api/auth/facebook/pages` | Debug — list pages from token | Dev |
| `/api/auth/facebook/import-pages` | Import all pages as accounts | Dev |
| `/api/accounts` (POST) | Add single account | Dev |
