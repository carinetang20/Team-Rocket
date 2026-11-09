<<<<<<< HEAD
# Team Rocket — Game Logic Engine (Person A)

Mars outpost survival engine: **stats, AP, tasks, sleep, events, hazards, boss endings, save/load**, plus **NASA DONKI** space-weather grounding.

Person B owns screens/UI. This package is the brain — no DOM.

## Quick start

```bash
npm install
npm test
npm run balance
npm run build
npm run demo
```

`npm run demo` opens a Mars-themed browser playtest wired to this engine (save/load in `localStorage`, curated or live DONKI).

Optional live NASA key (otherwise curated real DONKI samples are used):

```bash
export NASA_API_KEY=your_key_here
```

Or paste a key in the demo UI. Get one free at https://api.nasa.gov/

### Endings

On sol 15, among stats that reach **50**, the **highest** value wins the ending (ties use shield → food → power → health).

## Person B integration

```ts
import { GameEngine } from "teamrocket-engine";

const engine = new GameEngine({ seed: 42, useCuratedWeather: true });
await engine.startGame();

const view = engine.getView();
// view.stats, view.availableTasks, view.ap, view.phase, ...

engine.doTask("plant_crops");
engine.sleep();

if (view.phase === "hazard") {
  engine.acknowledgeHazard();
}

const save = engine.save();      // JSON string → localStorage
engine.load(save);
```

### Phases

| Phase | Meaning |
|--------|---------|
| `boot` | Before start |
| `day_start` / `acting` | Player spends AP on tasks |
| `hazard` | Cutscene day (3/6/9/12) — call `acknowledgeHazard()` then act or sleep |
| `boss` / `ended` | Sol 15 resolution or game over |

### Core stats

`hunger` (food), `power`, `shield`, `health` — start **12/50**. Every task has a trade-off. Sleep applies daily decay + production. Any stat at 0 → game over.

### Endings (sol 15)

Priority: **shield → food → power → health → bad** (need ≥ 50). Shield/health endings need upgrade tasks that raise max / production so they are reachable.

## Layout

```
src/engine/     config, state, tasks, events, hazards, sleep, boss, save, GameEngine
src/data/nasa/  DONKI live fetch + curated fallback + attribution
tests/          vitest
scripts/        balance-sim.ts
```

## Design notes (Person A)

- Deterministic RNG from `seed` for reproducible balance runs.
- No account required — save blob is plain JSON for `localStorage`.
- Live DONKI failures silently fall back to **curated** historical events (never labeled live).
=======
# Mars Outpost Survival

A 15-day survival and resource-management browser game for kids aged 7–12, by Team Rocket.

> **New here, or using an AI tool?** Start with [AGENTS.md](AGENTS.md).

## Run it

You need [Node.js](https://nodejs.org) (LTS version).

```sh
npm install      # first time only
npm run dev      # opens a local server, usually http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `npm run typecheck` | Checks the TypeScript for mistakes |
| `npm run build` | Builds the finished game into `dist/` (upload this folder to host it) |
| `npm run preview` | Plays the built version locally |

**Windows tip:** if `npm run dev` fails with "is not recognized as an internal or external command", your folder path probably contains a `&` (e.g. `extracurriculars&certs`). Rename or move the folder so the path has no `&`, or run the tools directly: `node node_modules/vite/bin/vite.js` and `node node_modules/typescript/bin/tsc`.

## Current state: clickable prototype

- Every screen from [docs/screen-flow.md](docs/screen-flow.md) exists as a grey box.
- The game runs on a **fake engine** ([src/fake-engine/](src/fake-engine/)) with rough numbers, so the flow can be clicked through before the real engine exists. Don't balance anything there.
- Grey dashed boxes are image placeholders, at the exact sizes in [docs/asset-list.md](docs/asset-list.md). Drop real art into `public/assets/` and it appears automatically.

### Debug tools

Press the **`** key (top-left of the keyboard), or open the game with `?debug` at the end of the URL. You can jump to hazard days, the final day, max out stats, or nearly die, to test every screen quickly.
>>>>>>> c3dbce401f7b6aec58411fb6f497715633b34a78
