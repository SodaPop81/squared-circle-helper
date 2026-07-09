# Squared Circle Helper — Deeper Source Split

This build keeps behavior intact and continues breaking `src/main.ts` into smaller files.

New files added:

- `src/features/bookingLogic.ts`
  - QPR value helpers
  - face/heel alignment helper
  - matchup key helper
  - event-type logic helpers
  - main-eventer/prelim classification helpers

- `src/features/cardBuilder.ts`
  - Card match type labels
  - team-size rules for tag/multi-man matches
  - card battle/team type checks
  - participant validation

- `src/features/federation.ts`
  - default event card creation
  - venue option rendering helper
  - event type option helper for future Federation Hub work

Existing files retained:

- `src/main.before-refactor.ts` remains as a safety reference.
- `src/main.ts` is still the app shell and still contains the live UI/match engine code.

Validation:

- `npm run build` passes.
