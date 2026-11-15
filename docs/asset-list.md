# Asset List

**For:** the art team and UI/UX designers. **Maintained by:** Person B.

Every image the game needs. Until a file exists, the game shows a grey placeholder box **at the exact size listed**, so when you drop in a file with the right name it appears with no code changes.

The placeholder sizes live in [src/content/assetManifest.ts](../src/content/assetManifest.ts). If you need a different size, tell Person B so the manifest is updated.

## How to deliver

- **Folder:** `public/assets/<category>/<file name>`, e.g. `public/assets/map/greenhouse.png`.
- **Format:** PNG with transparent background (characters, facilities, icons may also be SVG). Backgrounds and full-screen illustrations: PNG or JPG.
- **Size:** export at the listed size (already 2× for sharp screens). Keep the same aspect ratio if you go bigger.
- **Names:** lowercase, underscores, exactly as listed.
- **Style:** red Mars landscape, friendly and readable for ages 7–12. Facilities must be easy to tell apart by shape and colour.
- **Original designs only** — no characters or art based on existing games or shows.

Full-screen scenes are designed on a **1920 × 1080** canvas (16:9). The outpost map is **1440 × 1024**.

---

## 1. Title screen

No background image: the title uses a CSS Mars-sky gradient.

| File | Size (px) | Used on | Notes |
|---|---|---|---|
| `ui/logo.svg` | 960 × 360 | Title screen | ✅ Stand-in made: pixel "MARTIAN" + "Mars Outpost Survival" tagline. Artists may replace it (PNG is fine; update `assetManifest.ts`) |

## 2. Outpost map (Outpost View) ✅ delivered

The Outpost View is one map, **1440 × 1024**. Each building is its own full-map-size PNG, transparent except for that building, so all layers line up when stacked. Players click the building itself (only its visible pixels count).

| File | Size (px) | Notes |
|---|---|---|
| `map/empty_map.png` | 1440 × 1024 | Ground only; the background layer |
| `map/full_map.png` | 1440 × 1024 | Reference only (all buildings); not used in game |
| `map/main_base.png` | 1440 × 1024 | Main Base layer |
| `map/radiation_shelter.png` | 1440 × 1024 | Radiation Shelter layer (engine facility: Shield Generator) |
| `map/water_oxygen.png` | 1440 × 1024 | Water & Oxygen layer (covers both engine facilities: Oxygen Generator + Water Recycler) |
| `map/power_station.png` | 1440 × 1024 | Power Station layer |
| `map/greenhouse.png` | 1440 × 1024 | Greenhouse layer (both domes) |
| `map/glow/<building>.png` | 1440 × 1024 | **Generated** neon outline for hover; regenerate if a building layer changes |
| `map/thumbs/<building>.png` | ≤ 400 wide | **Generated** trimmed copy for the Report table |
| `facilities/shield_dome.svg` | 1440 × 1024 | ✅ Made: see-through force-field dome over the whole map. The game sets its opacity from the Shield level (0 = hidden) |

- **No separate art per status.** The game shows status with effects (damaged = dark red tint, unpowered = grey and dim, growing = soft pulsing outline) plus an icon and word on the label.
- Building labels and character spots are set in [src/content/mapLayout.ts](../src/content/mapLayout.ts), in map pixels.

## 3. Characters

| File | Size (px) | Notes |
|---|---|---|
Full art is delivered as `characters/<name>.png` (2048 × 2048; cat: `miau.png`, plus `miau_large.png`, a 4× upscale). The scene and portrait files below are **generated** from it (trimmed and scaled); regenerate them if the full art changes.

| File | Size (px) | Notes |
|---|---|---|
| `characters/jasslyn_portrait.png` | 400 × 400 | Commander; dialogue box portrait |
| `characters/jasslyn_scene.png` | 206 × 360 | Standing on the map (clickable) |
| `characters/jamie_portrait.png` | 400 × 400 | Assistant; gives tips and fun facts |
| `characters/jamie_scene.png` | 229 × 360 | Standing on the map (clickable) |
| `characters/miau_portrait.png` | 400 × 400 | Companion cat; from the 4× upscale, a little soft |
| `characters/miau_scene.png` | 260 × 171 | Lying on the map (clickable) |
| `characters/player_portrait.png` | 400 × 400 | The new astronaut |
| `characters/player_scene.png` | 229 × 360 | Standing on the map with a "You" tag (not clickable) |

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
| `icons/day.svg` | Day counter (HUD) ✅ |
| `icons/sleep.svg` | "End the Day?" button ✅ |
| `icons/base_management.svg` | "Report" (Base Management) button ✅ |
| `icons/warning.svg` | Upcoming hazard / alien line in the HUD ✅ |
| `icons/lock.svg` | Locked task reason ✅ |

## 5. Cutscenes & illustrations (full screen, 1920 × 1080)

| File | Used on |
|---|---|
| `cutscenes/opening_1.png` | Opening 1: the outpost before the attack |
| `cutscenes/opening_2.png` | Opening 2: everyday life on Mars (growing food, making air and water) |
| `cutscenes/opening_3.png` | Opening 3: one night, the ground shakes |
| `cutscenes/opening_4.png` | Opening 4: the alien attacks |
| `cutscenes/opening_5.png` | Opening 5: the broken outpost, supplies running low |
| `cutscenes/opening_6.png` | Opening 6: distress signal sent to Earth |
| `cutscenes/opening_7.png` | Opening 7: the player arrives |

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
| `endings/retaliate.png` | Crew fights back and chases the alien away (strategy id `evacuate`, see D8) |
| `endings/bad.png` | Alien destroys the outpost again |

## 6. Sound effects ✅ placeholders in place

All in `public/assets/sounds/`. The current files are **generated retro synth placeholders**. To replace one, drop in a new file with the **same name**; no code changes are needed. A missing file just plays nothing.

- **Format:** `.wav` (or `.mp3`, but then update the file name in [src/content/sounds.ts](../src/content/sounds.ts)). Short, mono, and quiet at the start and end (no clicks).
- **Volume** per sound is set in `src/content/sounds.ts`. Players can mute with the 🔊 button in the bottom-left corner.
- **Licence:** original or CC0 only (e.g. Kenney.nl). Nothing taken from existing games or shows.

| File | Plays when | Feel |
|---|---|---|
| `sounds/click.wav` | Any button or character click | Soft blip |
| `sounds/open.wav` | A pop-up opens | Quick rising whoosh |
| `sounds/close.wav` | A pop-up closes | Quick falling whoosh |
| `sounds/denied.wav` | Can't do that (not enough AP, locked) | Gentle "bonk", never harsh |
| `sounds/upgrade.wav` | An upgrade or task is done | Happy chime |
| `sounds/fixed.wav` | A broken building works again | Bright "ding" |
| `sounds/sleep.wav` | End the Day | Sleepy falling notes |
| `sounds/morning.wav` | A new day starts | Wake-up jingle |
| `sounds/warning.wav` | A hazard is coming | Alarm beeps |
| `sounds/hazard.wav` | A hazard hits | Rumble / crash |
| `sounds/breakdown.wav` | A building breaks or loses power | Sparks + power-down |
| `sounds/alien.wav` | The alien boss arrives | Low dramatic sting |
| `music/win.wav` | Good ending | Chiptune fanfare (made by the music generator, see 6b) |
| `music/lose.wav` | Bad ending / game over | Sad falling jingle (made by the music generator, see 6b) |

## 6b. Background music ✅ generated chiptune

All in `public/assets/music/`, made by [tools/music/generate.ts](../tools/music/generate.ts) (run `npm run music` after editing the notes). Seamless loops, mono WAV. WAV rather than MP3 because MP3 adds a gap at the loop point. Volumes are in [src/content/music.ts](../src/content/music.ts). The 🔊 button mutes music too.

| File | Plays on | Feel |
|---|---|---|
| `music/title.wav` | Title, opening story, results | Calm, a little mysterious (A minor, ~46 s loop) |
| `music/outpost.wav` | Days 1–13: outpost + daily pop-ups | Upbeat "let's rebuild" (C major, ~33 s loop) |
| `music/boss.wav` | Day 14 and the Day 15 plan choice | Fast and tense (E minor, ~26 s loop) |

Game over, "What happened?" and the ending screens have no music, so the win/lose jingle stands out. To replace a track, drop in a new loop with the same name.

## 7. Not needed from artists

Buttons, panels, stat bars, task cards, pop-ups and dialogue boxes are built in code by Person C (UI design). UI/UX designers: please send layouts and styles (colours, fonts, spacing) to Person C instead of exporting these as images.

## Checklist summary

- 1 logo (no title background)
- 19 facility images + 1 shield overlay
- 8 character images (+ optional expressions)
- 12 icons
- 7 cutscene images (opening only; boss cutscene and game-over picture dropped, D9)
- 8 hazard illustrations
- 5 ending illustrations

**Total: ~65 images.** Suggested priority: outpost background + facilities + icons first (seen every turn), then characters, then hazards/endings/cutscenes.
