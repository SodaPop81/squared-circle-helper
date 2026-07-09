# Squared Circle Helper iPad PWA Persistent Save Build

This build adds an offline-first persistent universe save system.

## What saves on-device

- Event/card builder data
- Event history
- Match history
- Feuds
- Allies/enemies
- Recent matchup tracking
- Adjusted wrestler Power Points/rankings data
- Current screen/view/territory

## Backup controls

On the dashboard you will see **Offline Save / Backup** with:

- Save Now
- Export Backup
- Import Backup
- Reset Saved Data

Use Export Backup regularly if you are playing a long-term universe on iPad.

## Build and upload

```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

Upload the generated `dist/` folder to your GitHub Pages repo.

## Offline use

Open the hosted site once while online, refresh once, then Add to Home Screen from Safari. After it caches, the app can run offline and save locally on the iPad.
