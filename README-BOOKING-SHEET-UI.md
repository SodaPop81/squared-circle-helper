# Squared Circle Helper — Booking Sheet UI 1.0

Refactor/UI pass focused on the Card Builder screen.

What changed:
- Card Builder now reads more like a booking sheet instead of a spreadsheet.
- Match controls are collapsed inside an "Edit Match" section.
- Event details moved into a cleaner show header and collapsible Show Setup panel.
- Added Run Next Match button at the card level.
- Kept existing Save Card / Return to Federation behavior.
- No match-engine rules were intentionally changed.

Validation:
- `npm run build` passed.
