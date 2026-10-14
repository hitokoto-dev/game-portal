# HITOKOTO ARCADE · Edition 03

Eight browser games rebuilt as distinct worlds, sharing local progression, achievements, daily missions, favorites, and records. Static HTML/CSS/JavaScript; no build, account, external audio, or gameplay API is required.

## Worlds

- PULSE GATE: 24 directional, color, arithmetic, reverse and sequence gates; three stages and a chaos route.
- NEON DRIFT: three sectors, bullet patterns, graze scoring, shields, safe zones, central multiplier, cooldown dash, a final boss sector, 90-second and endless routes.
- ORBIT TOWER: 12 floors of high/same/low comparisons; optional double-risk answers and explanations with sources.
- TRUTH SIGNAL: a 45-second true/false signal run; combo fever, science and procedural logic routes.
- WORD ATELIER: 38 phrases, three chapters, browser speech, meaning choices, focused review and a persistent phrase book with mastery stars.
- PHRASE VOYAGE: situation-to-English choices, airport/hotel/city chapters and review practice.
- KEYSTREAM: English and kana word lanes, combo scoring, editable full-text input, composition-safe IME handling, and a 45-second race.
- FOREST FRIENDS: generated clay object imagery, picture size/count/number comparisons, three areas and 12 untimed questions.

All games have normal/daily/practice entries, keyboard or touch controls, pause, audio volume, fullscreen where supported, and automatic results. Daily question and spawn seeds use the date in Japan (JST), game and route. Records remain on the visitor's browser and are not global leaderboards.

## Preservation

`archive/` retains the byte-identical original games and portal. `editions/02/` contains the complete prior Edition 02 release, including its own assets and archive. Existing original per-game repositories are unchanged. New records use `arcade3:*`; previous editions retain their own storage keys.

## Art

Three original artworks were generated with the built-in image-generation tool: cosmic portal hero, eight cover worlds, and sixteen clay comparison objects. Runtime JPEGs are in `assets/art/`. Their detailed production prompts and original PNG deliverables are retained in this chat's outputs.

## Validation

DOM-based tests cover all 24 game/mode combinations, pause clocks, results, rewards, review practice, duplicate response guards, daily repeatability, 480 reflex question fixtures, kana composition, endless continuation and all English routes. Prior releases are checked byte-for-byte. Browser QA covers responsive portal, collection controls and actual game UI. Native-device sound, speech availability, soft keyboard and fullscreen behavior depend on the visitor's browser.

Serve the repository root as a static site. GitHub Pages publishes `main`. Open `index.html` to begin.
