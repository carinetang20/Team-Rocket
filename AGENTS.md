# AGENTS.md — Read this first

This file is the entry point for **any AI coding tool** (Claude Code, Copilot, Cursor, ChatGPT, etc.) and any new teammate working on this repo.

## What this project is

**Mars Outpost Survival** — a 15-day, 2D survival / resource-management browser game for children aged 7–12. The player rebuilds a damaged Mars outpost, manages resources with Action Points (AP), survives hazards, and faces an alien boss on Day 15.

It must run in **any modern desktop or tablet browser** with nothing to install.

## Read these docs (in this order)

1. [docs/PLAN.md](docs/PLAN.md) — tech stack, architecture, team roles, timeline, ground rules.
2. [docs/decisions.md](docs/decisions.md) — **decisions that override or clarify the design doc.** If the design doc and this file disagree, `decisions.md` wins.
3. [docs/contract.md](docs/contract.md) — **DRAFT** engine ↔ UI contract (code: `src/contract/`).
4. [docs/screen-flow.md](docs/screen-flow.md) — every screen and how the player moves between them.
5. [docs/asset-list.md](docs/asset-list.md) — every image the game needs (for the art team).
6. [docs/game-design-overview.md](docs/game-design-overview.md) — the original game design document (source of truth for story, mechanics, and starting numbers, except where `decisions.md` overrides it).

How to run the game: [README.md](README.md).

## Project status

- **Phase:** Clickable grey-box prototype (Person B) running on a **fake engine**. Contract is a draft awaiting team review.
- **Next step:** Team kickoff → agree the contract → Person A builds the real engine in `src/engine/` and swaps it in at `src/main.ts`.

## Repo layout

```
src/
  contract/     SHARED (A + B): types.ts + engine.ts — the engine ↔ UI contract
  engine/       A: real rules engine (not created yet)
  config/       A: all balance numbers (not created yet)
  fake-engine/  B: TEMPORARY stand-in engine — delete when src/engine/ is ready
  flow/         B: screen order/state machine, saving, debug tools
  screens/      B: one function per screen (grey-box placeholders for now)
  content/      B: all player-facing text + asset manifest
  ui/           C: real UI components (not created yet)
  styles/       C: design system (not created yet; placeholder CSS is in screens/)
public/assets/  Art team: image files (see docs/asset-list.md)
docs/           Plans, decisions, contract, screen flow, asset list, design doc
```

## Team roles & folder ownership

| Role | Owner | Owns (planned folders) |
|---|---|---|
| **A — Game logic** ("the brain") | TBD | `src/engine/`, `src/config/`, `tools/simulator/`, engine tests |
| **B — Gameplay flow** ("the glue") | jayvan | `src/screens/`, `src/flow/`, `src/content/` (dialogue, tutorial, tips), asset integration |
| **C — UI design** ("the look") | TBD | `src/ui/` (presentational components), `src/styles/`, UI showcase page |
| Art + UI/UX (non-coding) | Separate people | Deliver files into `assets/` per the asset list |

**AI tools: stay inside your owner's folders.** If a change is needed in someone else's area, describe it in the pull request or open an issue instead of editing it.

## Rules for AI tools (and humans)

1. **Never hard-code game balance numbers.** Every number (stats, costs, damage, thresholds, durations) lives in the game config (`src/config/`). Code reads from it.
2. **The engine is pure logic, no UI.** `src/engine/` must not touch the DOM, CSS, or browser APIs (except via an injected save/load adapter). This lets the balance simulator run it headlessly.
3. **UI components are presentational.** `src/ui/` components take data in and emit clicks/events out. They never import the engine directly. `src/screens/` and `src/flow/` connect UI to engine.
4. **Follow the contract.** Engine ↔ UI communication goes only through the agreed state shape, actions, and engine events (to be written in `docs/contract.md`). Changing the contract requires agreement from A and B.
5. **TypeScript, strict mode.** Prefer clear names and short comments explaining *why*, since teammates read AI-written code.
6. **Placeholders at final dimensions.** Until real art arrives, use plain labelled boxes sized exactly as specified in the asset list, so real art drops in with no code changes.
7. **Kid-friendly UI.** Large text, icons plus colour (never colour alone), short plain-language messages, explain numbers with simple words.
8. **Small pull requests.** One feature per PR; another teammate skims it before merging. Engine changes must include/keep passing tests.
9. **Original IP only.** No characters, names, or art from existing games/shows (e.g. the companion cat must not be "Meowth").

## Tech stack (summary)

TypeScript + Vite → static site, hosted on GitHub Pages / itch.io. DOM-based UI with CSS; canvas/CSS animation only for the Mars scene and effects. Saves via `localStorage`. Seeded random number generator. Full details in [docs/PLAN.md](docs/PLAN.md).
