# Project Plan — Mars Outpost Survival

## 1. Tech stack

| Choice | Why |
|---|---|
| **TypeScript** (strict) | Most code is AI-written; types catch AI mistakes and enforce the engine ↔ UI contract. |
| **Vite** | Simple dev server; builds to a static folder. |
| **DOM + CSS for UI** | The game is menus, panels, cards and dialogue — easiest to build, style, and make accessible as normal web pages. |
| **Canvas / CSS animation** | Only for the Mars scene, cutscenes, and hazard effects. Phaser may be added later for the scene layer only, if needed. |
| **localStorage** | Save/continue in the same browser. |
| **Seeded RNG** | Testers can replay the exact same run when reporting bugs. |
| **Hosting** | GitHub Pages or itch.io (free, static). |

Target: any modern browser (Chrome, Edge, Firefox, Safari) on laptops, desktops, Chromebooks and tablets; mouse and touch.

## 2. Architecture

```
┌──────────────┐   reads    ┌──────────────────┐
│ Game config  │──────────▶│  Rules engine     │  (pure functions, no UI)
│ (all numbers)│           │  startDay, doTask, │
└──────────────┘           │  sleep, hazards,   │
                           │  boss, endings     │
                           └────────┬──────────┘
                    state + engine  │  ▲ actions
                    events          ▼  │ (doTask, sleep, chooseEnding…)
                           ┌──────────────────┐
                           │ Screens & flow   │  (Person B)
                           └────────┬─────────┘
                                    │ data in / clicks out
                           ┌──────────────────┐
                           │ UI components    │  (Person C)
                           └──────────────────┘

        Balance simulator (tools/) runs the engine headlessly,
        thousands of times, to check every ending is reachable.
```

1. **Game config** — every number from the design doc: starting stats, caps, consumption, production, task costs/effects/limits, hazards, events, thresholds. Rebalancing = editing numbers only.
2. **Game state** — day, AP, all six resources + max capacities, facility status, upgrade levels, crop timers, scheduled hazard, event log, run statistics.
3. **Rules engine** — pure functions:
   - `startDay`: grant AP (cap 6), roll daily event, build daily report, warn about next hazard/boss. On Day 15: no AP, emit `bossArrived`.
   - `doTask`: check AP, prerequisites, upgrade limits; apply effect.
   - `sleep`: hazard (on hazard days) → consumption → power allocation → production → health → game-over check.
   - `chooseStrategy`: Day 15 strategy check.
4. **Screens & flow** — state machine; see [screen-flow.md](screen-flow.md).
5. **Balance simulator** — scripted strategies ("rush Food", "rush Power", …) to verify each ending is reachable but not trivial.

## 3. The contract (to be written at kickoff → `docs/contract.md`)

A short document all three developers agree on before splitting off:

- **State shape** — which fields exist and their types.
- **Actions** — what the UI can call (`newGame()`, `doTask(id)`, `sleep()`, `startDay()`, `chooseStrategy(type)`, save/load) and what each returns.
- **Engine events** — what the engine reports for the UI to display (e.g. "Oxygen −5 because of Oxygen Leak"). Every pop-up and animation is driven by these.

**Requirements already agreed** (see [decisions.md](decisions.md)):
- Day 14 is the last playable day; when Day 15 begins the boss arrives immediately (no AP), signalled by a `bossArrived` event.
- Hazard results report **base damage, damage after protection, and which upgrade protected**.
- A **cause-of-death record** (which resources were low, for how many days, and whether a hazard caused the final drop).
- **Run statistics** for the results screen (days survived, final stats, tasks done, hazards survived, damage blocked, ending reached).
- Early-warning events when a resource has been below threshold for consecutive days.

Until the engine exists, Person B builds against a **fake engine** that returns made-up data in the contract's exact shape.

## 4. Team roles

### Person A — Game logic ("the brain")
Config, state, rules engine, events, hazards, boss/endings, save/load, tests, balance simulator. Resolves the open design issues (see [decisions.md](decisions.md)) with the design doc owner.

### Person B — Gameplay flow ("the glue") — *jayvan*
Screen flow/state machine, wiring UI to engine, tutorial + dialogue + fun facts + death tips (as content files), cutscene/hazard sequencing, asset integration, browser/device testing. Writes the asset list for the art team.

### Person C — UI design ("the look")
Design system (colours, fonts, spacing, icons as CSS variables), screen layouts, presentational UI components, UI showcase page, accessibility, responsive layout, visual feedback/animation states. Works with the art team on visual consistency.

**B ↔ C boundary:** C builds the pieces and decides how they look; B decides when they appear and connects them to the game.

### Art + UI/UX (separate people, non-coding)
Deliver assets into `assets/` following the asset list (names, sizes, PNG/SVG with transparency). Placeholders are used until then, so nobody is blocked.

## 5. Timeline

| Phase | A (logic) | B (flow) | C (UI design) |
|---|---|---|---|
| 1. Setup | Contract + conventions + repo structure (all together) | ← | ← |
| 2. Core | State, AP, tasks, sleep | Screen flow with grey placeholders + fake engine | Design system + wireframes |
| 3. Connect | Connect engine to flow; playable start to finish | ← | HUD, task cards, panels in showcase |
| 4. Depth | Events, hazards, boss; simulator + balance | Tutorial, dialogue, sequences; swap in C's components | Report, summary, dialogue, boss, ending screens |
| 5. Content | Tune numbers from playtests | Integrate real art | Styling polish, animation, accessibility |
| 6. Polish | Edge cases, save/load | Browser/device testing | Responsive + final visual pass |
| 7. Ship | Deploy | ← | ← |

## 6. Scope

**Must-have:** 15-day loop, AP, tasks, resources, sleep resolution, hazards + warnings, daily report, boss + 4 endings + bad ending, game over + tips, results screen, save/continue, tutorial.

**Nice-to-have:** companion cat, animated cutscenes (vs. still illustrations), sound/music, endings collection, extra random events.

## 7. Ground rules

- Never hard-code game numbers — use the config.
- Each person's AI stays in their own folders (see [AGENTS.md](../AGENTS.md)).
- Small PRs; at least one other person skims before merge. C reviews visual changes; A reviews anything touching game rules.
- Placeholders first; nobody waits on art.

## 8. Before kickoff (checklist)

- [ ] Confirm who is A and C (B = jayvan).
- [ ] Set deadline; confirm must-have vs nice-to-have.
- [ ] Choose the companion cat's original name and look.
- [ ] Everyone: accept GitHub invite; install Git, Node.js LTS, VS Code, AI tool.
- [ ] Everyone: read `AGENTS.md` and the docs it links.
- [ ] Set up team chat + task board (GitHub Projects).
- [ ] Agree asset formats with the art team.

**Kickoff agenda (~1 hr):** confirm roles/deadline → walk through design doc + resolve open issues → write the contract → everyone clones and runs the project → pick first tasks.
