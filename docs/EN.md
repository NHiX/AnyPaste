# AnyPaste - English Documentation

AnyPaste is a desktop clipboard manager designed to feel fast, elegant and private. It automatically captures copied text, makes it searchable, and lets users copy it again from a floating panel.

## Usage

1. Launch AnyPaste.
2. Copy text from any application.
3. Open the panel with `Ctrl+Shift+V`.
4. Search, copy, pin or organize clips into a board.

## Languages

The interface is available in French, English, Spanish and German from settings.

## Data

History is stored locally in the operating system user data directory. No clipboard data is sent to a server.

## Platforms

AnyPaste is built with Tauri for macOS, Windows and Linux. Native packages are generated with `npm run tauri:build`.

## macOS installation

The public DMG is ad-hoc signed. Without an Apple Developer ID certificate and notarization, macOS may still ask for confirmation in System Settings > Privacy & Security on first launch.

If macOS says "AnyPaste is damaged and can't be opened" with an older download, install the latest release or clear quarantine:

```bash
xattr -dr com.apple.quarantine /Applications/AnyPaste.app
```
