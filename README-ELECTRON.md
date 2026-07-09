# Squared Circle Helper Electron Build

This desktop build includes the latest WarGames and Survivor Series upgrades.

## Run as desktop app

```bash
rm -rf node_modules package-lock.json release dist
npm install
npm run desktop
```

## Build Mac app / DMG

```bash
npm run dist:mac
```

Output appears in:

```bash
release/
```

## Included

- WarGames entrance order
- WarGames advantage team
- Survivor Series elimination order
- Who-eliminated-who summaries
- Survivor(s) summary
- Persistent save/export/import support
- Vite relative asset fix for Electron packaged app
