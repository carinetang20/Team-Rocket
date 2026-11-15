# Mars Outpost Survival

A 15-day survival and resource-management browser game for kids aged 7–12, by Team Rocket.

> **New here, or using an AI tool?** Start with [AGENTS.md](AGENTS.md).

**Play it online:** https://carinetang20.github.io/Team-Rocket/

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

## Current state: clickable prototype + real engine

- Every screen from [docs/screen-flow.md](docs/screen-flow.md) exists as a grey box.
- The game runs on Person A's **real engine** ([src/engine/](src/engine/)), with all balance numbers in [src/config/](src/config/).
- The old [src/fake-engine/](src/fake-engine/) remains for reference; do not balance there.
- Grey dashed boxes are image placeholders, at the exact sizes in [docs/asset-list.md](docs/asset-list.md). Drop real art into `public/assets/` and it appears automatically.

| Extra command | What it does |
|---|---|
| `npm test` | Runs Person A engine unit tests |
| `npm run balance` | Headless balance simulator (many seeded runs) |

### Debug tools

Press the **`** key (top-left of the keyboard), or open the game with `?debug` at the end of the URL. You can jump to hazard days, the final day, max out stats, or nearly die, to test every screen quickly.

## Use of SI (Super Intelligence / AI tools)

Made for the NASA Space Apps Challenge. We used an SI coding assistant, **Claude (Anthropic) via Claude Code**, and mark everything it produced:

| What | SI use | How it's marked |
|---|---|---|
| **Code** | Much of the TypeScript was written with SI help and reviewed by the team. Game rules are covered by automated tests. | This section, plus the `si-disclosure` meta tag in [index.html](index.html) |
| **Images** | `public/assets/ui/logo.svg`, `public/assets/facilities/shield_dome.svg`, and the icons `day`, `sleep`, `base_management`, `warning`, `lock` in `public/assets/icons/` | Visible "SI-generated" text on the logo and shield effect; "SI" badge on each icon; credit line on the title screen |
| **Audio** | All music and jingles in `public/assets/music/` (made by [tools/music/generate.ts](tools/music/generate.ts), itself SI-written) and the sound effects in `public/assets/sounds/` | SI note in each WAV file's metadata (LIST/INFO comment); credit line on the title screen |
| **Human-made** | Character art, opening cutscenes, hazard scenes, endings and the outpost map were drawn by our team | — |

No NASA logos, branding or mission identifiers are used.

## Real facts from NASA

The game teaches a real space fact with every hazard warning, every hazard, and the "What happened?" screen, plus Jamie's chat lines. Each fact shows a link to the NASA page it came from. The facts and links live in `src/content/dialogue.ts` (`HAZARD_FACTS`, `LIFE_SUPPORT_FACTS`).

| Topic in the game | NASA source |
|---|---|
| Dust storms | [The Fact and Fiction of Martian Dust Storms](https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/) |
| Solar flares / radiation | [NASA Watches Mars Light Up During Epic Solar Storm](https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm/) |
| Power (solar vs nuclear) | [10 Things: Massive Dust Storm on Mars](https://science.nasa.gov/solar-system/planets/mars/10-things-massive-dust-storm-on-mars/) |
| Meteors | [NASA Probe Counts Space Rock Impacts on Mars](https://www.jpl.nasa.gov/news/nasa-probe-counts-space-rock-impacts-on-mars/) |
| Oxygen | [NASA's Oxygen-Generating Experiment MOXIE Completes Mars Mission](https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) |
| Water | [NASA Achieves Water Recovery Milestone on International Space Station](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) |
| Growing food | [Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/) |
| Food for a Mars trip | [Thermostabilized Shelf Life Study (NASA Technical Reports Server)](https://ntrs.nasa.gov/citations/20090006887) |
| Mars basics (sol, red colour, air, temperature) | [Mars Facts](https://science.nasa.gov/mars/facts/) |

Game numbers (damage, costs, days) are still made up for balance; only the facts shown to players are real.
