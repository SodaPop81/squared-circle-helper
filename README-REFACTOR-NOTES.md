# Squared Circle Helper — Main.ts Refactor Notes

This build is intended as a refactor-only baseline. No match-engine behavior was intentionally changed.

## What changed

`src/main.ts` was split into smaller support files:

- `src/types.ts` — shared TypeScript types for wrestlers, matches, cards, events, history, feuds, tag teams, and managers.
- `src/data.ts` — static roster/promotion data, venues, territories, pin charts, official tag teams, and managers.
- `src/utils.ts` — shared helpers for localStorage JSON loading, dice rolls, caps, star display, and time/move conversion.
- `src/main.ts` — still contains the app flow, rendering, match engine, card builder, federation state, and UI wiring.

## Validation

`npm run build` completed successfully after the refactor.
