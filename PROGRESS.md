# Progress

## Done

- Dashboard redesigned with KPI sparkline cards, mini editorial calendar, post queue, recent activity with thumbnails, and system health section
- Accounts page redesigned: card grid layout, platform icons, search bar, filter tabs, action buttons, Dual-Platform badge, Sync button
- Posts list page enhanced with search bar, sort dropdown, status/platform filters, date range chips, result count
- Create post page restructured: 60/40 split layout with sticky right preview, card containers, platform tabs, media grid with drag-and-drop, scheduling pickers
- Live preview component with Instagram (4:5 crop) and Facebook (natural ratio) views, carousel with nav arrows
- DatePicker and TimePicker using react-datepicker library
- SegmentedControl primitive for tab/toggle groups
- Chip component for status badges (colored, uppercase pill)
- Design tokens as CSS variables (Tailscale-inspired palette, Inter typography, spacing/radius/shadows)
- Dark/light theme support via :root (dark) and .light (light) token blocks
- Card headers with consistent horizontal padding via --card-padding
- Profile picture sync via batch /me/accounts with per-account fallback
- App shell with fixed left sidebar, bottom nav at 786px breakpoint
- Post detail page (app/posts/[id]) with retry/reschedule form
- PATCH /api/posts/[id] endpoint for rescheduling failed posts
- Import-pages route now refreshes tokens on existing accounts (not just inserts new ones)

## Needed: Production Readiness

### Tokens
- Page Access Tokens are refreshed and stored (9 accounts, dual-platform)
- META_ACCESS_TOKEN (User Token) must stay valid with pages_show_list, instagram_basic, pages_read_engagement

### Public URL (required for media posts and Instagram)
- Meta's servers need to fetch media URLs -> localhost won't work
- Options: ngrok, Cloudflare Tunnel, or a real domain
- Set NEXT_PUBLIC_API_URL to the public URL once available

### Text-only Facebook Posts
- Should work now with current setup

### Instagram Posts
- Requires media (always) + public URL for that media
- Requires Business/Creator Instagram account linked to a Facebook Page

### Known Issues
- react-datepicker popper may clip on narrow viewports if overflow:hidden is set on parents
- Profile pictures from Meta API return null if access tokens expire
