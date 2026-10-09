# Frontend redesign — NVDA edition

## Design direction

**Premium market terminal, not a generic neon trading dashboard.** The UI uses ink/graphite surfaces, slate dividers, a readable type scale, tabular numbers, and NVIDIA green as a restrained brand accent. Green/red remain reserved for movement and BUY/SELL semantics, so the brand color does not overwhelm decisions.

## What changed

- Rebalanced the palette to near-black graphite, slate surfaces, brighter text, NVIDIA green accents, clean positive/negative colors, and clearer focus rings.
- Separated the game's own mark from NVIDIA's company logo. The header uses the game's chart mark; NVIDIA's official horizontal SVG is placed on a light, high-contrast plaque at the stock identity and execution-price areas.
- Preserved the logo's proportions and did not apply glow, recoloring, filters, or distortion.
- Added a small disclaimer that the simulation is an independent learning project and is not sponsored by NVIDIA.
- Refined the entry screen hierarchy, stats, join card, room controls, progress/timer, event panel, candlestick chart container, order controls, personal portfolio, leaderboard, and result reveal.
- Increased card radii and spacing while retaining compact mobile order controls and the sticky trade dock.
- Kept game rules, event logic, order mechanics, calculations, and realtime transport unchanged.

## Logo note

The image is served from NVIDIA's official brand-guideline URL already referenced in the project. It is displayed on a pale neutral plaque because the current horizontal asset uses a dark wordmark that loses contrast when placed directly on the game's dark canvas. If the official asset URL changes, replace `src` in `components/Game.jsx` with a locally hosted, official horizontal logo asset. Do not redraw, recolor, distort, or add effects to the logo.

## Files changed

- `app/globals.css`
- `components/Game.jsx`
- `components/MarketChart.jsx`

## Verification

- Unit tests: 16/16 pass.
- Room integration: 50 players, 9 rounds, 450 accepted orders pass.
- Production build not confirmed in this environment: the provided dependency tree has no native Next.js SWC binary, and the environment could not reach npm registry to download it.
