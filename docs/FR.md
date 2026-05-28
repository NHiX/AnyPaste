# AnyPaste - Documentation française

AnyPaste est une application desktop de gestion du presse-papiers, pensée pour rester rapide, élégante et privée. Elle capture automatiquement le texte copié, le rend consultable, puis permet de le copier à nouveau depuis une interface flottante.

## Utilisation

1. Lancez AnyPaste.
2. Copiez du texte depuis n’importe quelle application.
3. Ouvrez le panneau avec `Ctrl+Shift+V`.
4. Recherchez, copiez, épinglez ou classez vos clips dans un tableau.

## Langues

L’interface est disponible en français, anglais, espagnol et allemand depuis les réglages.

## Données

L’historique est stocké localement dans le dossier de données utilisateur du système. Aucune donnée n’est envoyée vers un serveur.

## Plateformes

AnyPaste est conçu avec Tauri pour macOS, Windows et Linux. Les paquets natifs sont générés via `npm run tauri:build`.

## Installation macOS

Le DMG public est signé en ad-hoc. Sans certificat Apple Developer ID et notarisation, macOS peut demander une confirmation dans Réglages Système > Confidentialité et sécurité au premier lancement.

Si macOS affiche "AnyPaste est endommagé et ne peut pas être ouvert" avec un ancien téléchargement, installez la dernière release ou retirez la quarantaine :

```bash
xattr -dr com.apple.quarantine /Applications/AnyPaste.app
```
