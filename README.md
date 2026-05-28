# AnyPaste

AnyPaste is an elegant, local-first clipboard manager for macOS, Windows and Linux. It is inspired by modern clipboard workflows such as Paste's search, pinboards and privacy controls, and by lightweight open-source alternatives such as PasteClip.

AnyPaste est un gestionnaire de presse-papiers élégant, local et multiplateforme pour macOS, Windows et Linux. Il s’inspire des workflows modernes de Paste, comme la recherche, les pinboards et les contrôles de confidentialité, ainsi que d’alternatives open source légères comme PasteClip.

## Features

- Local clipboard history with persistent JSON storage.
- Floating quick-access panel with search and keyboard-friendly quick copy.
- Pinning and pinboards for organizing important clips.
- Pause/resume capture when copying sensitive data.
- Global shortcut: `Ctrl+Shift+V`.
- Four built-in languages: French, English, Spanish and German.
- Tauri desktop shell for native packaging on macOS, Windows and Linux.

## Fonctionnalités

- Historique local du presse-papiers avec stockage JSON persistant.
- Panneau flottant avec recherche rapide et copie en un geste.
- Épinglage et tableaux pour organiser les clips importants.
- Pause/reprise de la capture pour éviter d’enregistrer des données sensibles.
- Raccourci global : `Ctrl+Shift+V`.
- Quatre langues intégrées : français, anglais, espagnol et allemand.
- Shell desktop Tauri pour générer des applications natives macOS, Windows et Linux.

## Stack

- Tauri 2
- Rust
- React 19
- TypeScript
- Vite

## Development

```bash
npm install
npm run icon
npm run tauri:dev
```

## Build

```bash
npm install
npm run icon
npm run tauri:build
```

The generated installers are written under `src-tauri/target/release/bundle`.

## Développement

```bash
npm install
npm run icon
npm run tauri:dev
```

## Compilation

```bash
npm install
npm run icon
npm run tauri:build
```

Les installateurs générés sont disponibles dans `src-tauri/target/release/bundle`.

## Privacy

Clipboard data stays on the user’s machine. AnyPaste does not include telemetry, remote sync or cloud storage. The current implementation stores text clips only.

## Confidentialité

Les données du presse-papiers restent sur la machine de l’utilisateur. AnyPaste n’intègre ni télémétrie, ni synchronisation distante, ni stockage cloud. L’implémentation actuelle stocke les clips texte uniquement.

## Roadmap

- Image and file clipboard capture.
- Editable clips.
- Configurable shortcuts from the settings UI.
- Optional encrypted storage.
- Import/export.
- Native auto-launch settings.

## License

MIT
