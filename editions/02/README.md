# HITOKOTO ARCADE · Edition 02

Browser game portal for hitokoto-dev. Open `index.html`, or serve this directory with a static HTTP server. No build step is required.

## What changed

- A responsive, searchable collection with category filters, favorites, a random game shortcut, and browser-local play history.
- Eight new editions under `games/`, preserving the original game rules and sound engines.
- Automatic records separated by game and mode, mistake review, English phrase review practice, shared volume settings, fullscreen controls, and additional keyboard accessibility.
- Duplicate answer locks in True / False and typing, a resize and background pause improvement for TAMAYOKE, and repairs to two existing text encoding errors.

## Preservation

`archive/` contains byte-for-byte copies of the original eight games and portal. `archive-manifest.json` records source commit IDs and SHA-256 hashes. The original per-game repositories and URLs remain usable. The previous portal also remains at `archive/portal/`.

## Records

New records use `arcade:*` or `arcade-v2:*` browser storage keys. The original records use their original keys. The new editions do not write scores to the classic Supabase boards. A read-only "旧版" tab retains access to classic online scores. New global rankings will require a separate version-aware backend rather than sharing the classic boards.

## Validation (2026-10-14)

All eight games passed DOM-based game-flow tests for start, correct and incorrect answers, result, storage, review, and applicable retry behavior. Duplicate scoring guards passed. Every preserved file matched its SHA-256 digest. All eight opened and started in the browser without runtime console errors; desktop and representative mobile layouts were visually checked. Portal filters, search, favorites, archive switching, and the record dialog were tested in the browser. Physical Android keyboard, audio playback, and fullscreen behavior remain device-dependent and have not been tested on the user's device.

Deploy as a static site. The production GitHub Pages portal uses this repository's `main` branch.
