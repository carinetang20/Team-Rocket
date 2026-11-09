# Screen Flow

Owner: **Person B (gameplay flow)**. Draft — edit freely. Behaviour decisions referenced as D1–D4 are in [decisions.md](decisions.md).

Boxes are screens; arrows are what the player does or what triggers the transition.

```
                 ┌──────────────┐
                 │  TITLE       │
                 │ [New] [Load] │
                 └──────┬───────┘
          New Game      │      Continue (load save)
            ┌───────────┴──────────────┐
            ▼                          │
   ┌──────────────────┐                │
   │ OPENING CUTSCENE │  (Skip button) │
   │ alien attacks    │                │
   └────────┬─────────┘                │
            ▼                          │
   ┌──────────────────┐                │
   │ TUTORIAL (Day 1) │                │
   │ Jasslyn + Jamie  │                │
   └────────┬─────────┘                │
            ▼                          ▼
 ╔══════════════════════ DAY LOOP (Days 1–14) ═══════════════════════╗
 ║                                                                   ║
 ║   ┌──────────────┐   ┌───────────────────────────┐                ║
 ║   │ DAILY REPORT │──▶│ WARNING                   │                ║
 ║   │ (Day 2+)     │   │ hazard: Days 2, 5, 8, 11  │                ║
 ║   └──────┬───────┘   │ boss:   Day 14 (last day!)│                ║
 ║          │           └────────────┬──────────────┘                ║
 ║          ▼                        ▼                               ║
 ║   ┌───────────────────────────────────┐                           ║
 ║   │          OUTPOST VIEW             │◀─────────────┐            ║
 ║   │  (main screen: HUD + facilities)  │              │            ║
 ║   │  Jamie warns if a resource has    │              │            ║
 ║   │  been low 2+ days (D3)            │              │            ║
 ║   └──┬──────────┬──────────┬──────────┘              │            ║
 ║      │          │          │                      close /         ║
 ║   click      open       click                     task done       ║
 ║   facility   Base Mgmt  cat / NPC                    │            ║
 ║      ▼          ▼          ▼                         │            ║
 ║   [TASK     [BASE MGMT  [DIALOGUE] ──────────────────┤            ║
 ║    MENU]     PANEL] ─────────────────────────────────┤            ║
 ║      └───────────────────────────────────────────────┘            ║
 ║                   │                                               ║
 ║          Sleep button  OR  AP hits 0                              ║
 ║                   ▼                                               ║
 ║        ┌──────────────────────────┐                               ║
 ║        │ HAZARD SCENE (D2)        │ Days 3, 6, 9, 12 only         ║
 ║        │ cutscene / dialogue, then│                               ║
 ║        │ Jamie explains damage &  │                               ║
 ║        │ what protected you       │                               ║
 ║        └─────────┬────────────────┘                               ║
 ║                  ▼                                                ║
 ║        ┌────────────────────┐   Health = 0                        ║
 ║        │  SLEEP SUMMARY     │──────────────┐                      ║
 ║        │ "what happened     │              │                      ║
 ║        │  overnight"        │              │                      ║
 ║        └─────────┬──────────┘              │                      ║
 ║                  │ survived                │                      ║
 ║        Days 1–13 └──▶ next DAILY REPORT    │                      ║
 ║        Day 14 ───────────────────────┐     │                      ║
 ╚══════════════════════════════════════╪═════╪══════════════════════╝
                                        │     │
                Day 15 begins (D1):     │     ▼
                no AP, no tasks         │   ┌──────────────────┐
                                        │   │ GAME OVER   (D3) │
                                        ▼   └────────┬─────────┘
                       ┌──────────────────────┐      ▼
                       │ BOSS CUTSCENE        │   ┌──────────────────┐
                       │ the alien returns!   │   │ WHAT WENT WRONG? │
                       └──────────┬───────────┘   │ Jamie: cause +   │
                                  ▼               │ 1–2 tips         │
                       ┌──────────────────────┐   └────────┬─────────┘
                       │ CHOOSE STRATEGY      │            │
                       │ Shield│Food│Power│   │            │
                       │ Evacuate             │            │
                       └──────────┬───────────┘            │
                     chosen stat ≥ 50?                     │
                 ┌────────────────┴────────────────┐       │
                yes                                no      │
                 ▼                                 ▼       │
       ┌──────────────────┐              ┌──────────────┐  │
       │ WIN ENDING (1/4) │              │ BAD ENDING   │  │
       └────────┬─────────┘              └──────┬───────┘  │
                └──────────────┬────────────────┘          │
                               ├───────────────────────────┘
                               ▼
                ┌──────────────────────────┐
                │ RESULTS (D4)             │
                │ days, stats, tasks,      │
                │ hazards, damage blocked, │
                │ ending, endings 2/4      │
                │ [Try Again] [Title]      │
                └──────────────────────────┘
           Try Again → new run at Day 1 (skips the opening + tutorial)
```

## Screen list

| # | Screen | Type | When | Notes |
|---|---|---|---|---|
| 1 | Title | Full screen | Start | New Game / Continue |
| 2 | Opening cutscene | Full screen | New game | Skippable |
| 3 | Tutorial | Overlay on Outpost View | Day 1 | Jasslyn + Jamie |
| 4 | Daily report | Pop-up | Days 2–14 | Resources, facility updates, random event |
| 5 | Warning | Pop-up | Days 2, 5, 8, 11 (hazard); Day 14 (boss — last day to prepare) | |
| 6 | **Outpost view** | Main screen | Days 1–14 | HUD + facilities; low-resource warnings |
| 7 | Task menu | Pop-up | Click facility | |
| 8 | Base Management panel | Side panel | Top-right button | |
| 9 | Dialogue | Pop-up | Click NPC / cat | |
| 10 | Hazard scene | Full screen / dialogue | Sleep on Days 3, 6, 9, 12 | Shows protection effect |
| 11 | Sleep summary | Pop-up | End of Days 1–14 | |
| 12 | Game over | Full screen | Health = 0 | |
| 13 | What went wrong? | Pop-up / screen | After game over | Cause + tips |
| 14 | Boss cutscene | Full screen | Start of Day 15 (after the Day 14 night) | No AP or tasks on Day 15 |
| 15 | Choose strategy | Full screen | After boss cutscene | 4 choices; shows current stat vs. needed |
| 16 | Win ending ×4 / Bad ending | Full screen | After choice | |
| 17 | Results | Full screen | After every run | Try Again / Title |

## Still to decide

- Does **Try Again** replay the tutorial, or skip straight to Day 1? (Prototype: skips; consider a "replay tutorial" option on the title screen.)
- Can the player **save mid-day**, or only at the start of each day? (Prototype: auto-saves at the start of each day.)
- Should the **strategy choice** show the player's current stat next to each option (e.g. "Food: 42 / 50 needed")? (Prototype: yes — it's educational and avoids feeling tricked.)
