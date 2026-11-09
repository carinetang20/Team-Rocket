# Asset List

**For:** the art team and UI/UX designers. **Maintained by:** Person B.

Every image the game needs. Until a file exists, the game shows a grey placeholder box **at the exact size listed**, so when you drop in a file with the right name it appears with no code changes.

The placeholder sizes live in [src/content/assetManifest.ts](../src/content/assetManifest.ts). If you need a different size, tell Person B so the manifest is updated.

## How to deliver

- **Folder:** `public/assets/<category>/<file name>`, e.g. `public/assets/facilities/greenhouse_operational.png`.
- **Format:** PNG with transparent background (characters, facilities, icons may also be SVG). Backgrounds and full-screen illustrations: PNG or JPG.
- **Size:** export at the listed size (already 2× for sharp screens). Keep the same aspect ratio if you go bigger.
- **Names:** lowercase, underscores, exactly as listed.
- **Style:** red Mars landscape, friendly and readable for ages 7–12. Facilities must be easy to tell apart by shape and colour.
- **Original designs only** — no characters or art based on existing games or shows.

Game is designed on a **1920 × 1080** canvas (16:9).

---

## 1. Backgrounds & scenes

| File | Size (px) | Used on | Notes |
|---|---|---|---|
| `backgrounds/title.png` | 1920 × 1080 | Title screen | Leave space top-centre for the logo |
| `backgrounds/outpost.png` | 1920 × 1080 | Outpost View | Mars ground + sky; facilities are placed on top as separate images |
| `ui/logo.png` | 960 × 360 | Title screen | Game title "Mars Outpost Survival" |

## 2. Facilities (placed on the outpost background)

Each facility needs **3 states**. Greenhouse needs a 4th.

| File pattern | Size (px) | States |
|---|---|---|
| `facilities/main_base_<state>.png` | 400 × 300 | `operational`, `damaged`, `unpowered` |
| `facilities/shield_generator_<state>.png` | 300 × 300 | `operational`, `damaged`, `unpowered` |
| `facilities/power_station_<state>.png` | 400 × 260 | `operational`, `damaged`, `unpowered` |
| `facilities/greenhouse_<state>.png` | 400 × 260 | `operational`, `damaged`, `unpowered`, `growing` |
| `facilities/oxygen_generator_<state>.png` | 260 × 300 | `operational`, `damaged`, `unpowered` |
| `facilities/water_recycler_<state>.png` | 260 × 300 | `operational`, `damaged`, `unpowered` |
| `facilities/shield_dome.png` | 1920 × 1080 | Transparent dome overlay, opacity changes with Shield level |

- **operational:** lights on, clean.
- **damaged:** cracks, smoke or sparks.
- **unpowered:** darker, lights off.
- **growing:** green plants visible (Greenhouse only).

## 3. Characters

| File | Size (px) | Notes |
|---|---|---|
| `characters/jasslyn_portrait.png` | 400 × 400 | Commander; dialogue box portrait |
| `characters/jasslyn_scene.png` | 200 × 360 | Standing in the outpost (clickable) |
| `characters/jamie_portrait.png` | 400 × 400 | Assistant; gives tips and fun facts |
| `characters/jamie_scene.png` | 200 × 360 | Standing in the outpost (clickable) |
| `characters/cat_portrait.png` | 400 × 400 | Companion cat — **original design, name TBD** |
| `characters/cat_scene.png` | 160 × 140 | Sits beside Jasslyn (clickable) |
| `characters/player_portrait.png` | 400 × 400 | The new astronaut |
| `characters/alien_boss.png` | 1200 × 1000 | Big, a little scary but not terrifying for kids |

Nice to have: portrait expressions (`_happy`, `_worried`) for Jasslyn and Jamie.

## 4. Icons

All **128 × 128**, SVG preferred. Must be understandable without colour (shape matters).

| File | Meaning |
|---|---|
| `icons/food.svg` | Food |
| `icons/power.svg` | Power |
| `icons/shield.svg` | Shield |
| `icons/health.svg` | Health |
| `icons/oxygen.svg` | Oxygen |
| `icons/water.svg` | Water |
| `icons/ap.svg` | Action Point (e.g. a battery pip or lightning bolt) |
| `icons/day.svg` | Day counter |
| `icons/sleep.svg` | Sleep button |
| `icons/base_management.svg` | Base Management panel button |
| `icons/warning.svg` | Hazard / low resource warning |
| `icons/lock.svg` | Locked task |

## 5. Cutscenes & illustrations (full screen, 1920 × 1080)

| File | Used on |
|---|---|
| `cutscenes/opening_1.png` | Opening: the outpost before the attack |
| `cutscenes/opening_2.png` | Opening: the alien attacks |
| `cutscenes/opening_3.png` | Opening: distress signal sent to Earth / player arrives |
| `cutscenes/boss_arrives.png` | Day 15: the alien returns |
| `cutscenes/game_over.png` | Health reached 0 |

### Hazards (one each)

| File | Hazard |
|---|---|
| `hazards/oxygen_leak.png` | Oxygen Leak |
| `hazards/water_contamination.png` | Water Contamination |
| `hazards/solar_flare.png` | Solar Flare |
| `hazards/generator_malfunction.png` | Generator Malfunction |
| `hazards/dust_storm.png` | Dust Storm |
| `hazards/meteor_shower.png` | Meteor Shower |
| `hazards/alien_invasion.png` | Alien Invasion (alien demands food) |
| `hazards/crop_infestation.png` | Crop Infestation |

### Endings

| File | Ending |
|---|---|
| `endings/shield.png` | Barrier Shield holds, alien gives up |
| `endings/food.png` | Alien is fed and leaves happy |
| `endings/power.png` | Power Station overload zaps the alien |
| `endings/evacuate.png` | Team safely returns to Earth |
| `endings/bad.png` | Alien destroys the outpost again |

## 6. Not needed from artists

Buttons, panels, stat bars, task cards, pop-ups and dialogue boxes are built in code by Person C (UI design). UI/UX designers: please send layouts and styles (colours, fonts, spacing) to Person C instead of exporting these as images.

## Checklist summary

- 3 backgrounds/logo
- 19 facility images + 1 shield overlay
- 8 character images (+ optional expressions)
- 12 icons
- 5 cutscene images
- 8 hazard illustrations
- 5 ending illustrations

**Total: ~61 images.** Suggested priority: outpost background + facilities + icons first (seen every turn), then characters, then hazards/endings/cutscenes.
