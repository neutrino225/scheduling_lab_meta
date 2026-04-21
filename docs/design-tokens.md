# Meta Lab Design Tokens

This app uses Chakra UI v3 system tokens as the single source of truth.

## Token Sources

- Core token config: `theme/tokens.ts`
- Chakra system export: `theme/index.ts`

## Color Model

- Brand scale: `brand.50` to `brand.900`
- Neutral scale: `neutral.50` to `neutral.900`
- Status colors: `success`, `warning`, `danger`, `info`

## Semantic Tokens

- Surface: `bg.canvas`, `bg.surface`, `bg.subtle`
- Text: `text.primary`, `text.muted`
- Borders: `border.default`
- Action: `accent.primary`
- Status: `status.success`, `status.warning`, `status.danger`, `status.info`

## Typography

- Heading: `Space Grotesk`
- Body: `Manrope`
- Mono: `IBM Plex Mono`

## Layout Tokens

- Card radius: `radii.card`
- Panel shadow: `shadows.panel`
- App bar z-index: `zIndex.appBar`
- Max content width token: `sizes.content`

## Usage Rules

- Do not hardcode new hex colors in screens.
- Prefer semantic tokens in component props (`bg`, `color`, `borderColor`).
- Keep focus states accessible via global tokenized outline.
- New screens should compose from app shell and Chakra components.
