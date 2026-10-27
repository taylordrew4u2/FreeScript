# FreeScript

A free, offline screenwriting app for Mac. No account, subscription, or writing limits.

## Download for Mac

Download **[FreeScript for Mac (.dmg)](https://github.com/taylordrew4u2/FreeScript/releases/latest/download/FreeScript-1.0.0-Mac-universal.dmg)**.

Requires **macOS 13 Ventura or later**. One universal installer supports Apple Silicon and Intel Macs. The release is tested on Apple Silicon; Intel execution has not been tested on physical hardware.

1. Open the `.dmg` and drag **FreeScript** to **Applications**.
2. Open FreeScript from Applications.
3. This initial release is **unsigned and not notarized**. If macOS blocks it, use **System Settings → Privacy & Security → Open Anyway** after attempting to open the app. Only do this for a copy you trust from this repository.

## Write

- Scene headings, action, character cues, dialogue, parentheticals, and transitions.
- **Enter** creates the next screenplay element. **Tab / Shift Tab** changes its type.
- Scene navigation and search, multiple screenplays, focus mode, zoom, and undo/redo.
- Local autosave; export a FreeScript JSON backup to keep an independent copy.
- Import Fountain, plain text, or FreeScript JSON backups.
- Export editable Fountain or a US Letter PDF with a title page.
- Native Mac menus, keyboard shortcuts, file save dialogs, and spellcheck.

Scripts stay in the app's local storage on your Mac. Removing app data removes those scripts; export backups regularly. There is no server, telemetry, or cloud sync. The desktop application does not require an internet connection.

The editor uses a continuous writing surface. Page counts and running times are estimates; the PDF has final page breaks. Fountain support covers common screenplay elements, not the full Fountain specification (for example, dual dialogue, rich-text markup, sections, and notes).

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| New screenplay | ⌘ N |
| Import | ⌘ O |
| Export / save backup | ⌘ S |
| Export PDF | ⌘ P |
| Undo / redo | ⌘ Z / ⌘ Shift Z |
| Focus mode | ⌘ Shift F |
| Help | ⌘ / |
| Next element | Enter |
| Change element type | Tab / Shift Tab |
| New line in the same element | Shift Enter |

Select All within the editor selects the current element. Use Fountain export to copy the full screenplay to another app.

## Develop

Use Node.js 22.12+ or a newer supported LTS version and npm.

```sh
npm ci
npm start             # build and launch the Mac desktop app
npm run dev           # browser development server
npm test              # screenplay and import/export tests
npm run test:desktop  # automated tests in the real Electron app
```

`test:desktop` uses temporary app storage and leaves your writing library untouched. Desktop testing and DMG creation require macOS.

## Build the DMG

```sh
npm ci
npm run dist:mac
```

The universal installer is generated in `release/`. App icons are checked in; regenerate them on macOS with `sh scripts/make-icon.sh`.

The default configuration applies only an ad hoc signature for local app integrity. It has no Apple Developer ID signature or notarization, so Gatekeeper treats it as an unidentified developer. A future notarized release needs an Apple **Developer ID Application** identity and Apple notarization credentials; an Apple Development certificate is insufficient for distribution through Gatekeeper. Never commit signing credentials.

## License

[MIT](LICENSE). Electron and other dependencies retain their own licenses.
