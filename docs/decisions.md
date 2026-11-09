# Decisions Log

Decisions made after the original design doc ([game-design-overview.md](game-design-overview.md)). **Where these conflict with the design doc, this file wins.** Add new decisions at the bottom with a date.

Guiding principle: the game should be **educationally challenging, not needlessly brutal.** Players should always understand why something happened and have a chance to recover.

---

## Confirmed decisions

### D1 — The boss arrives at the start of Day 15 *(revised 2026-11-09)*
- **Matches** design doc §2/§11 ("alien boss returns at the beginning of Day 15").
- **Day 14 is the last playable day.** Day 14's morning shows a boss warning ("The alien returns tomorrow morning! Today is your last day to prepare").
- After the Day 14 night (normal consumption, production, health and death check), Day 15 begins and the **boss cutscene plays immediately**, followed by the strategy choice.
- **No AP, no tasks, no daily report on Day 15.**
- **Contract:** `startDay` into the final day grants no AP and emits a `bossArrived` event.
- *History:* an earlier version of D1 made Day 15 a playable day with a "Face the Alien" button. That was reverted on 2026-11-09 in favour of the design doc's original timing.

### D2 — Hazards resolve during the sleep step *(2026-11-09)*
- On hazard days (3, 6, 9, 12), after the player presses Sleep (or AP hits 0): **hazard scene → Jamie explains → sleep summary.**
- The hazard scene is a short custom cutscene or illustrated dialogue for that specific hazard.
- Jamie explains *why* damage was higher or lower, e.g. "Your reinforced habitat blocked 3 damage!" or "A reinforced habitat would have protected us."
- **Contract requirement:** the engine reports base damage, final damage after protection, and which upgrade(s) reduced it.
- The warning day (2, 5, 8, 11) is therefore the player's last full day to prepare.

### D3 — Game over: retry from Day 1, with tips *(2026-11-09)*
- When Health reaches 0: **Game Over → "What went wrong?" (Jamie) → Results → [Try Again] / [Title].**
- Try Again restarts at Day 1 (new run).
- "What went wrong?" shows the **cause** (e.g. "Oxygen was too low for 4 days in a row") and 1–2 **tips** (e.g. "Repair the Oxygen Generator early — it's cheap!").
- Tips are **content data** (cause → tip mapping), editable without changing code.
- **Contract requirement:** the engine records a cause-of-death record (which resources were below threshold, for how many consecutive days, and whether a hazard caused the final drop).
- **Prevention:** Jamie warns during the day when a resource has been below threshold for 2+ consecutive days, so death is never a surprise.

### D4 — Results screen after every run *(2026-11-09)*
- Shown after both wins and losses.
- Displays: days survived, final stats (Food, Power, Shield, Health, Oxygen, Water), tasks completed, hazards survived, damage blocked by upgrades, ending reached.
- **Endings collection** ("Endings unlocked: 2/4"), saved in the browser — nice-to-have, encourages replay.
- **Contract requirement:** the engine tracks run statistics.

### D5 — Original companion character *(2026-11-08)*
- "Meowth" is an existing copyrighted character and must not be used. Keep a companion cat with an **original name and design** (name TBD at kickoff).

---

## Open design issues (for Person A + design doc owner)

Found when checking the design doc's numbers. Must be resolved before balancing.

| # | Issue | Why it matters | Suggested direction |
|---|---|---|---|
| O1 | **Shield ending is unreachable.** Shield starts at 10, has no passive recovery, and no task raises it (Reinforce Habitat only reduces damage). | One of four endings can never be won. | Add a task like "Charge Shield (+X)" or a Shield Generator upgrade that produces Shield daily. |
| O2 | **Health ending is unreachable.** Health only regenerates overnight: best case 10 + 2 × 14 nights = 38, before any hazard damage. | One of four endings can never be won. | Add Health sources (med bay, rest task, food/cat bonuses) or adjust the threshold. |
| O3 | **Facility starting condition undefined.** Tasks like "Repair Oxygen Generator" imply some start broken. | Determines early-game difficulty. | Define which facilities start damaged and what "damaged" means (0% or 50% output). |
| O4 | **Power shortage order undefined.** | Without a rule, shortages become an unpredictable death spiral. | Fixed shutdown priority, e.g. keep Oxygen → Water → Greenhouse → Shield (Shield shuts off first). |
| O5 | **Upgrade limits undefined.** | Players could stack one upgrade forever. | Max level per task. |
| O6 | **Food/Power endings are tight.** | May be reachable only with near-perfect play. | Verify with the balance simulator. |