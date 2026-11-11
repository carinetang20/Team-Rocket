# Engine ↔ UI Contract — DRAFT

**Status:** Proposal by Person B, to be reviewed and agreed at kickoff by A, B and C.
**Code version:** [src/contract/types.ts](../src/contract/types.ts) (types) and [src/contract/engine.ts](../src/contract/engine.ts) (engine interface). If this doc and the code disagree, fix one so they match.

Changing the contract after kickoff needs agreement from **A and B** (and C if it affects what UI components receive).

---

## 1. Principles

1. **The engine is pure.** Every action is `(state, input) → { state, events }`. No DOM, no timers, no `localStorage`, no `Math.random()` (use the seeded RNG stored in state).
2. **State is the truth; events are the story.** The UI draws HUD/panels from `state`, and drives pop-ups, animations and dialogue from `events`.
3. **The engine never decides screens.** It reports what happened; the flow layer (Person B) decides which screen shows it.
4. **IDs, not display text, for game logic.** The engine includes human-readable `name`/`message` fields for convenience, but the UI may replace them with its own wording (e.g. Jamie's kid-friendly explanations in `src/content/`).
5. **All numbers come from the config** (`src/config/`, Person A).

---

## 2. Identifiers

| Type | Values |
|---|---|
| `ResourceId` | `food`, `power`, `shield`, `health`, `oxygen`, `water` |
| `CoreStatId` | `food`, `power`, `shield`, `health` (the four ending stats) |
| `LifeSupportId` | `food`, `water`, `oxygen` (the three Health-threshold resources) |
| `FacilityId` | `mainBase`, `shieldGenerator`, `powerStation`, `greenhouse`, `oxygenGenerator`, `waterRecycler` |
| `FacilityStatus` | `operational`, `damaged`, `unpowered`, `growing` |
| `Strategy` | `shield`, `food`, `power`, `evacuate` |
| `TaskId`, `HazardId`, `RandomEventId` | strings defined in the config (Person A may add/rename) |

---

## 3. Game state (`GameState`)

| Field | Type | Meaning |
|---|---|---|
| `version` | number | Save format version (bump when shape changes). |
| `seed` | number | RNG seed for this run. |
| `rngState` | number | Current RNG position (keeps the engine pure and replayable). |
| `day` | number | 1–15. |
| `phase` | `'playing' \| 'won' \| 'lost' \| 'dead'` | `playing` until Health hits 0 (`dead`) or the boss is resolved (`won` / `lost`). |
| `ap` | number | Action Points available now. |
| `apCap` | number | Max AP (6). |
| `resources` | `Record<ResourceId, { current, max }>` | All six resources. |
| `facilities` | `Record<FacilityId, FacilityState>` | Status, level, production/consumption per day. |
| `upgrades` | `Record<TaskId, number>` | How many times each task has been done (its level). |
| `crops` | `{ readyOnDay, amount }[]` | Planted crops still growing. |
| `upcoming` | `{ day, kind: 'hazard' \| 'boss', hazardId? } \| null` | The next warned threat. |
| `lowStreaks` | `Record<LifeSupportId, number>` | Consecutive nights each life-support resource ended below threshold. |
| `stats` | `RunStats` | For the results screen (D4). |
| `deathCause` | `DeathCause \| null` | Filled when `phase === 'dead'` (D3). |
| `outcome` | `Outcome \| null` | Filled when the run ends. |

`FacilityState`: `{ id, status, level, producesPerDay: Partial<Record<ResourceId, number>>, powerUse }`.

`RunStats`: `{ daysSurvived, tasksCompleted, apSpent, hazardsSurvived, damageBlocked }`.

`DeathCause`: `{ lowResources: { resource, nightsBelow }[], finalBlow: 'lowResources' | 'hazard', hazardId?, hazardName? }`.

`Outcome`: `{ result: 'win' | 'bad' | 'dead', strategy?, required?, actual? }`.

---

## 4. Actions (`GameEngine`)

The engine also exposes `rules: { finalDay, endingRequired, lifeSupportThreshold }` (read from the config) so screens can show "Day 3 / 15" or "Food: 42 / 50 needed" without hard-coding numbers.

| Action | When valid | What it does |
|---|---|---|
| `newGame({ seed? })` | Always | New run at Day 1, AP granted. Returns Day 1 events (no daily report on Day 1). |
| `getTasks(state)` | `playing` | Every task as a `TaskView` (available or locked, with reason). Read-only. |
| `doTask(state, taskId)` | `playing` | Spends AP, applies effect. If invalid, state is unchanged and a `taskRejected` event explains why. If AP reaches 0 on Days 1–14, the flow layer calls `sleep` (engine does not auto-sleep). |
| `sleep(state)` | `playing`, Days 1–14 | Night resolution (order below). May end in `dead`. Does **not** start the next day. |
| `startDay(state)` | `playing`, after a survived `sleep` | Advances the day, grants AP (capped), rolls the random event, emits warnings. **When the new day is Day 15:** grants no AP and emits only `bossArrived` (D1). |
| `chooseStrategy(state, strategy)` | `playing`, Day 15 only (after `bossArrived`) | Resolves the boss. Sets `phase` to `won` or `lost`. |
| `serialize(state)` / `deserialize(text)` | Always | Save/load. The flow layer handles storage. |

`TaskView`: `{ id, name, description, category, facility, apCost, level, maxLevel, available, lockedReason?, effects[] }`
- `maxLevel`: `null` means no limit (e.g. Plant Crops can be repeated).
- `lockedReason`: kid-friendly reason the task can't be done (not enough AP, max level, missing prerequisite).
- `effects`: preview of resource costs/gains (`now` / `max` / `perDay` / `delayed` / `info`) so the UI can show +/− before spending AP.
### Night resolution order (`sleep`) — proposal for Person A to confirm
1. Hazard, if today is a hazard day (D2) → `hazardStruck`.
2. Consumption (Food, Water, Oxygen) → `consumption`.
3. Power: production, then allocation by priority; shortfall shuts off facilities → `powerShortage`, `facilityStatusChanged`.
4. Facility production + ready crops → `production`, `cropsReady`.
5. Health check vs thresholds → `healthChanged`.
6. Death check → `gameOver` (with `DeathCause`).
7. Otherwise → `nightEnded`.

### Morning order (`startDay`)
Days 2–14: `dayStarted` → `randomEvent` (optional) → `warning` (Days 2, 5, 8, 11 hazard; Day 14 boss) → `lowResourceWarning` (any resource below threshold for 2+ nights, D3).

Day 15: `bossArrived` only (no AP, no tasks). The flow layer goes straight to the boss cutscene and strategy choice (D1).

---

## 5. Engine events (`EngineEvent`)

Every event has a `type`. `ResourceChange` = `{ resource, delta, field: 'current' | 'max', reason }`.

| `type` | Payload | UI use |
|---|---|---|
| `dayStarted` | `day, apGranted, apTotal, apLostToCap` | Daily report header, AP animation. |
| `randomEvent` | `eventId, name, message, positive, changes[]` | Daily report entry. |
| `warning` | `kind: 'hazard' \| 'boss', day, hazardId?, hazardName?, hint?` | Warning pop-up. |
| `lowResourceWarning` | `resource, nightsBelow` | Jamie warns in Outpost View. |
| `taskCompleted` | `taskId, name, apSpent, newLevel, changes[]` | Feedback toast / stat animation. |
| `taskRejected` | `taskId, reason` | Show reason on the card. |
| `hazardStruck` | `hazardId, name, description, damage: { resource, base, final, blockedBy: { taskId, name, amount }[] }[]` | Hazard scene + Jamie's protection explanation (D2). |
| `consumption` | `changes[]` | Sleep summary. |
| `powerShortage` | `shortfall, facilitiesOff[]` | Sleep summary warning. |
| `facilityStatusChanged` | `facility, from, to, reason` | Facility visuals, summary. |
| `production` | `changes[]` | Sleep summary. |
| `cropsReady` | `amount` | Sleep summary. |
| `healthChanged` | `delta, reason: 'allHealthy' \| 'oneLow' \| 'manyLow' \| 'hazard', lowResources[]` | Sleep summary with explanation. |
| `gameOver` | `cause: DeathCause` | Game over → "What went wrong?" (D3). |
| `nightEnded` | `day` | Sleep summary footer. |
| `bossArrived` | `day` | Day 15 has begun → boss cutscene + strategy choice (D1). |
| `bossResolved` | `strategy, required, actual, success` | Ending screen. |

---

## 6. Owned outside the engine (flow layer, Person B)

- Which screen shows which events.
- Saving to / loading from `localStorage` (auto-save at the start of each day).
- **Profile data across runs:** endings unlocked (D4 collection), tutorial seen.
- Dialogue, tutorial script, Jamie's explanations, death tips (`src/content/`).

---

## 7. Questions for kickoff

1. Does `doTask` apply effects immediately (e.g. Repair Oxygen Generator → status `operational` now) or overnight? *Proposal: immediately, so kids see the result.*
2. Should the engine emit kid-friendly text, or only IDs + numbers with all wording in `src/content/`? *Proposal: engine gives plain names; Jamie's wording lives in content.*
3. Are hazards chosen at warning time (so the warning names the hazard) or at strike time? *Proposal: at warning time, so players can prepare specifically.*
