# Squared Circle Helper

## Current Development Build
Build 21A

## Last Stable Release
Stable Release 3 – Booking Sheet UI

---

## Stable Releases

### Stable Release 1
- Initial Federation Mode

### Stable Release 2
- Header Navigation
- Rankings
- Universe improvements

### Stable Release 3 – Booking Sheet UI
- Book Show workflow
- Booking Advisor below the card
- Card Builder with collapsible match slots
- Current Card summary
- Universe roster filtering
- Save / Load
- Match builder polish

---

## Development Log

### Build 20
#### Fixed
- Saved Results reset when starting a new card
- Initial Booking Advisor synchronization repairs

### Build 20.2
#### Fixed
- Booking Advisor applies booked wrestlers correctly
- Active roster / universe filtering for Booking Advisor and card booking

#### Known Issues Carried Forward
- Full Match may still launch the Quick Match path
- Each universe still needs its own isolated current card and saved results

### Build 21A
#### Added
- Project documentation files: `PROJECT.md`, `KNOWN_ISSUES.md`, and `IDEAS.md`
- Auto-generated match labels with manual override
- Auto-label reset button in each match slot
- Cleaner Saved Results card layout

#### Fixed / Polished
- Changing match type keeps the current match panel open
- Return to Federation remains as secondary navigation above the card
- Save / Export / Import / Reset button typography is standardized

---

## Future Build Targets

### Build 21B
- Universe-specific current cards
- Universe-specific saved results

### Build 21C
- Full Match / Quick Match routing fix

### Build 22
- Championship selector
- Championship-aware labels
- Title defense and title change handling

### Build 23
- Completed Shows archive
- Event recap/history

### Build 24
- Multiple future cards per universe
- Event calendar and pre-booking


## Build 21B

Fixed
- Universe-specific current cards and saved results.
- Switching WWF / Crockett / Combined now loads that universe's own booking sheet.

Polish
- Import Backup button typography aligned with other save buttons.
- Saved Results spacing/card layout improved.
- Match card headers centered with a three-column layout.

## Build 21C

Fixed / Polished
- Saved Results now render as cleaner result cards with spacing between the match title, result type, time, ranking update, and notable events.
- Fixed missing separator between the match label and `QUICK MATCH RESULT` / `QUICK TAG RESULT` text.
- Match card headers now use a balanced three-column layout so titles sit visually centered between the expand control and action buttons.
- Current Card/show rundown remains unchanged structurally while the booking sheet presentation is tightened.

## Build 21D
### Added
- Automatic Show Complete mode after the final booked match is run.
- Show Complete recap with match count, average rating, main event, match of the night, Start Next Show, and Return to Federation.

### Fixed
- Current Card summary no longer duplicates participant text.
- Completed cards hide booking/editing controls and preserve final results for review.
