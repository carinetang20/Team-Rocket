# Game Design Overview: Mars Outpost Survival

## 1. Game Overview

**Working concept:** Mars Outpost Survival  
**Genre:** 2D Survival / Resource Management / Strategy  
**Target Audience:** Children aged 7–12  
**Main Objective:** Survive for 15 days on Mars by rebuilding and maintaining a damaged outpost, managing resources, completing tasks, and preparing for the return of a powerful alien boss.

The game is an educational survival-management experience where players take on the role of a beginner astronaut assigned to help rebuild a damaged Martian outpost.

Players must manage limited resources, maintain essential facilities, respond to random events and environmental hazards, and make strategic decisions about how to spend their Action Points (AP).

The game is designed to teach basic resource management, planning, prioritisation, decision-making, and the consequences of short-term versus long-term choices.

---

## 2. Storyline and Setting

The game takes place on Mars at an outpost operated by a team called **Team Rocket**.

Before the player's arrival, a large alien monster attacks the outpost and destroys most of its facilities. The remaining astronauts send an emergency distress signal to Earth requesting assistance.

The player takes the role of a newly recruited astronaut who travels to Mars to help rebuild the outpost and ensure the team's survival.

Upon arrival, the player is introduced to the situation by Commander Jasslyn, who explains the outpost's condition, introduces the facilities, and teaches the player how to manage resources.

The player must survive for 15 days while rebuilding the outpost and preparing for the alien's eventual return.

At the beginning of Day 15, the alien boss returns, triggering the final encounter. The player's previous decisions and resource-management strategy determine which ending they can achieve.

---

## 3. Characters

### Main Character (Player)
- A newly recruited astronaut sent from Earth.
- Controlled directly by the player.
- Responsible for maintaining the outpost, completing tasks, and ensuring the team's survival.

### Commander Jasslyn
- The commander of Team Rocket.
- Introduces the player to the outpost and its situation.
- Provides tutorials, instructions, and important mission information.
- Guides the player through the main objectives.

### Jamie
- The commander's assistant.
- Provides additional explanations and fun facts about Mars, space, and the outpost.
- Helps the player understand tasks and gameplay mechanics.

### Meowth
- An optional companion who sits beside Commander Jasslyn.
- The player may interact with and feed Meowth.
- Feeding Meowth may provide useful items or bonuses.
- This is an optional supporting mechanic and should not be essential to completing the game.

### Alien Boss
- A large alien monster responsible for destroying the outpost at the beginning.
- Appears in the opening cutscene.
- Returns on Day 15 as the final boss.
- The player's resource-management decisions determine the outcome of the final encounter.

---

## 4. Outpost Facilities

The outpost contains several facilities, each serving a specific purpose.

| Facility | Purpose |
|---|---|
| Main Base | Main living and operational area for the astronauts |
| Shield Generator | Generates the protective barrier around the outpost |
| Power Station | Produces and stores electrical energy using solar panels and batteries |
| Greenhouse / Plantation | Produces food through crop cultivation |
| Oxygen Generator | Produces oxygen for the astronauts |
| Water Recycler | Recycles and replenishes the outpost's water supply |

Each facility contributes to the survival of the outpost.

Facilities may become damaged, inefficient, or temporarily non-operational due to hazards, random events, or insufficient Power.

### Base Management Panel

The game should include a Base Management panel, preferably accessible from the top-right corner of the screen.

This panel allows players to inspect the condition of their facilities without needing to visit each building individually.

Suggested information to display:

- Facility name and icon.
- Current operational status (Operational, Damaged, Growing, etc.).
- Resource production per day.
- Facility upgrades or improvements.
- Whether the facility is currently functioning.

For example, the Greenhouse could display its current crop-growth status and estimated food production.

Jamie may provide explanations about the facilities and their conditions.

---

## 5. Core Gameplay Loop

The main objective is to survive for 15 days.

The gameplay follows this general cycle:

1. Start a new day and receive a daily report.
2. Review resource levels, facility conditions, and any incoming threats.
3. Receive Action Points (AP).
4. Choose which tasks to complete.
5. Manage resources and decide whether to continue working or sleep early.
6. Sleep to end the day.
7. Apply daily resource consumption, production, and health changes.
8. Check whether the player has survived.
9. Proceed to the next day.

The cycle repeats until the player reaches Day 15 or loses the game.

### Action Points (AP)

Action Points represent the amount of work the player can perform each day.

- The player receives 3 AP at the beginning of each day.
- Different tasks consume different amounts of AP.
- The player can voluntarily sleep before using all available AP.
- Remaining AP carries over to the next day.
- AP storage has a maximum capacity of 6 AP.
- If the player's AP reaches 0, the day ends automatically.

The recommended interpretation of the AP cap is that the player's total AP after receiving the next day's allocation cannot exceed 6.

For example:
- Player ends Day 1 with 2 unused AP.
- Player receives 3 AP on Day 2.
- Total AP becomes 5.

This allows players to save AP for more expensive tasks while preventing unlimited accumulation.

### Daily Reports

From Day 2 onwards, the player receives a daily report at the beginning of each day.

The report may contain:
- Current resource conditions.
- Facility status updates.
- Random positive or negative events.
- Warnings about upcoming major hazards.
- Important mission information.

Day 1 should focus on the tutorial and introduction to the game's mechanics.

### Sleeping and Daily Updates

Sleeping ends the current day and triggers the daily survival calculations.

During this process:
- Food, Water, and Oxygen are consumed.
- Power is consumed by operating facilities.
- Facilities produce resources if operational and sufficiently powered.
- Health changes depending on the player's survival conditions.
- The game checks whether any critical survival condition has caused a game over.

If Health reaches 0, the player loses.

---

## 6. Resource Management System

The game contains four main core stats and two additional life-support resources.

### 6.1 Core Stats

All four core stats initially start at 10, with a maximum capacity of 50.

| Core Stat | Starting Value | Starting Maximum | Purpose |
|---|---:|---:|---|
| Food | 10 | 50 | Represents the available food supply |
| Power | 10 | 50 | Supplies energy to the outpost's facilities |
| Shield | 10 | 50 | Represents the strength of the outpost's protective barrier |
| Health | 10 | 50 | Represents the astronaut's physical condition |

The maximum capacity may be increased through certain upgrade tasks.

**Important distinction:**
- Current value represents the amount currently available.
- Maximum capacity represents the highest amount that can be stored or maintained.
- Increasing maximum capacity does not automatically refill the current resource unless specifically stated by the task.

Stats can exceed the original maximum of 50 after capacity upgrades.

The four core stats also correspond to the four possible final endings.

### 6.2 Additional Life-Support Resources

Oxygen and Water are additional resources that have their own levels or meters.

They are not counted as additional core stats.

| Resource | Purpose |
|---|---|
| Oxygen | Required for the astronauts to survive |
| Water | Required for the astronauts to remain healthy |

Oxygen and Water are consumed daily.

The Oxygen Generator replenishes Oxygen, while the Water Recycler replenishes Water.

If Oxygen or Water falls below its survival threshold, the astronaut's Health decreases.

### 6.3 Resource Relationships

The resources are interconnected.

**Food**
- Decreases daily due to astronaut consumption.
- Replenished by the Greenhouse.
- Low Food levels eventually cause Health loss.

**Power**
- Consumed by the Shield Generator, Greenhouse, Oxygen Generator, and Water Recycler.
- Replenished by solar panels.
- Insufficient Power can reduce or stop facility operations.
- Power is particularly important because a shortage can affect several other resources simultaneously.

**Shield**
- Protects the outpost from environmental hazards and attacks.
- Can be damaged by events such as meteor showers and dust storms.
- Defensive upgrades reduce the damage received.
- Shield also determines whether the player can achieve the Shield ending.

**Health**
- Represents the astronaut's physical condition.
- Decreases when essential survival resources are insufficient or when the astronaut suffers damage.
- Regenerates when Food, Water, and Oxygen are all above their respective survival thresholds.
- Reaching 0 Health results in a game over.

**Oxygen**
- Decreases through daily consumption.
- Replenished by the Oxygen Generator.
- Low Oxygen causes Health loss.

**Water**
- Decreases through daily consumption.
- Replenished by the Water Recycler.
- Low Water causes Health loss.

### 6.4 Health Rules

The following is the proposed initial Health system:

| Condition | Health Change |
|---|---:|
| Food, Water, and Oxygen all above their thresholds | +2 |
| One resource below its threshold | -2 |
| Two or more resources below their thresholds | -3 |
| Severe hazard or injury | -3 to -5 |

The initial proposed survival threshold for Food, Water, and Oxygen is 5.

These values should be treated as initial balancing values and adjusted through testing.

---

## 7. Proposed Daily Resource Economy

The following values are a first-pass balancing proposal, not final confirmed values.

| Resource | Daily Consumption | Daily Production |
|---|---:|---:|
| Food | -2 | +3 from Greenhouse |
| Oxygen | -2 | +3 from Oxygen Generator |
| Water | -2 | +3 from Water Recycler |
| Power | -4 total facility consumption | +3 from Solar Panels |
| Shield | No automatic daily decrease proposed | No passive recovery proposed |
| Health | Depends on survival conditions | +2 when all life-support resources are healthy |

### Power Consumption

The proposed daily Power consumption is:

| Facility | Power Consumption |
|---|---:|
| Shield Generator | -1 |
| Greenhouse | -1 |
| Oxygen Generator | -1 |
| Water Recycler | -1 |
| Total | -4 |

With solar panels producing 3 Power per day, the outpost loses 1 Power per day.

Installing additional solar panels could increase daily Power production by another 2, bringing total production to 5 per day.

This would allow the outpost to generate a daily Power surplus of 1.

Power should remain an important limiting resource. Players should not be able to operate every facility indefinitely without considering energy production.

**Unresolved balancing consideration:** A complete Power shortage could create a chain reaction in which facilities stop working, causing Oxygen, Water, and Food shortages, followed by Health loss. The implementation should be tested to ensure that the player has a reasonable recovery opportunity and cannot become trapped in an unavoidable failure state.

---

## 8. Tasks and Upgrades

Players spend AP to complete tasks around the outpost.

Tasks can:
- Restore damaged facilities.
- Increase resource production.
- Increase maximum resource capacity.
- Improve defensive capabilities.
- Prepare the outpost for upcoming hazards.

### Proposed Task Table

| Category | Task | AP Cost | Proposed Effect |
|---|---|---:|---|
| Life Support | Repair Oxygen Generator | 2 | Improves Oxygen production by +3 per day |
| Life Support | Repair Water Recycler | 1 | Improves Water production by +3 per day |
| Power | Install Solar Panels | 2 | Increases Power production by +2 per day |
| Power | Upgrade Batteries | 2 | Increases maximum Power capacity by +10 |
| Shielding | Reinforce Habitat | 2 | Reduces Shield damage from hazards by 3 |
| Shielding | Build Radiation Shelter | 2 | Reduces radiation-related Health damage by 3 |
| Food | Plant Crops | 1 | Increases future Food production by +3 per day after 2 days |
| Food | Expand Greenhouse | 2 | Increases maximum Food capacity by +10 and production capacity by +2 per day |

These effects are proposed values and should be adjusted based on implementation and playtesting.

### Task Design Considerations

Tasks should provide a mixture of immediate and delayed benefits.

For example:
- Repairing a damaged Oxygen Generator improves Oxygen production.
- Installing Solar Panels improves daily Power generation.
- Planting crops provides food only after a growth period.
- Upgrading batteries increases storage capacity rather than immediately giving the player more Power.
- Reinforcing the habitat reduces future hazard damage.

Crop growth should take approximately 2–3 days so that players must plan ahead.

Tasks should also have appropriate prerequisites where necessary. For example, expanding the Greenhouse should require an existing Greenhouse or Plantation.

Avoid allowing players to repeatedly purchase the same upgrade without limits. Certain upgrades should have maximum levels or require specific facilities.

---

## 9. Random Events and Hazards

The game includes two types of events:

1. Daily random events.
2. Major environmental hazards.

### 9.1 Daily Random Events

Random events occur during the game and may be positive or negative.

Examples include:

| Event | Type | Description |
|---|---|---|
| Oxygen Leak | Negative | A damaged pipe causes Oxygen to escape |
| Underground Ice Discovery | Positive | The astronauts discover an underground water source |
| Equipment Malfunction | Negative | A facility experiences operational problems |
| Supply Discovery | Positive | The player discovers useful supplies |
| Alien Discovery | Varies | The team discovers information or signs of the alien |

These events should introduce variety and encourage players to adapt their strategies.

### 9.2 Major Hazards

Major hazards occur every three days:

- Day 3
- Day 6
- Day 9
- Day 12

The player receives a warning one day before the hazard occurs.

The warning gives the player time to prepare by repairing facilities, upgrading defences, or managing resources.

Major hazards should be randomly selected from the hazard pool.

No normal major hazard should overlap with the final boss encounter on Day 15.

### 9.3 Hazard Table

The following table contains the proposed hazards and initial effects.

| Category | Hazard | Description | Proposed Effect |
|---|---|---|---|
| Life Support | Oxygen Leak | Damaged pipes cause Oxygen to escape | Oxygen -5 |
| Life Support | Water Contamination | The Water Recycler becomes contaminated | Water -5 |
| Power | Solar Flare | A solar storm disrupts electrical systems | Power -6 |
| Power | Generator Malfunction | The main generator experiences a malfunction | Power -5 |
| Shielding | Dust Storm | A powerful Martian dust storm hits the outpost | Shield -7 |
| Shielding | Meteor Shower | Meteors strike the outpost | Shield -6, Power -6 |
| Food | Alien Invasion | An alien demands food from the astronauts | Food -6 |
| Food | Crop Infestation | Space pests damage the greenhouse crops | Food -5 |

These are starting damage values. Defensive upgrades, facility conditions, and event-specific mechanics may modify the actual damage.

For example, Reinforce Habitat reduces the proposed Dust Storm damage from 7 Shield to 4 Shield.

Radiation-related damage should be reduced by the Radiation Shelter.

Hazards should be challenging but should not cause an unavoidable game over from a single event when the player has prepared reasonably well.

### 9.4 Hazard Scheduling

The proposed hazard schedule is:

| Day | Event |
|---|---|
| Day 2 | Warning for Day 3 hazard |
| Day 3 | Major hazard |
| Day 5 | Warning for Day 6 hazard |
| Day 6 | Major hazard |
| Day 8 | Warning for Day 9 hazard |
| Day 9 | Major hazard |
| Day 11 | Warning for Day 12 hazard |
| Day 12 | Major hazard |
| Day 14 | Final preparation before boss encounter |
| Day 15 | Final boss encounter |

Daily random events should be kept separate from major hazards. Consider skipping ordinary negative events on major hazard days, or limiting them to minor events, to avoid overwhelming the player with multiple severe penalties.

---

## 10. Low Resource Consequences

Resources should have consequences when they become critically low.

| Resource | Proposed Consequence |
|---|---|
| Food | Below 5, Health gradually decreases |
| Power | Below 5, essential facilities become less effective or may stop working |
| Shield | Lower Shield makes the outpost more vulnerable to hazards |
| Health | At 0, the game ends |
| Oxygen | Below 5, Health decreases |
| Water | Below 5, Health decreases |

Power shortages are particularly dangerous because they can affect the operation of the Shield Generator, Greenhouse, Oxygen Generator, and Water Recycler.

The exact facility shutdown rules and resource thresholds should be consistent throughout the game.

---

## 11. Final Boss Encounter and Ending System

On Day 15, the alien boss returns to attack the outpost.

The player must choose one of four possible strategies.

Each strategy checks a specific core stat.

**Important mechanic:** The game only checks the stat associated with the strategy selected by the player. It does not automatically select the best ending based on the player's highest stat.

The player can therefore achieve a successful ending only if they have prepared the corresponding resource.

### Ending 1: Activate the Barrier Shield

**Required Stat:** Shield ≥ 50

The player activates the fully upgraded barrier around the outpost.

The alien attempts to attack but cannot break through the powerful shield. Eventually, the alien gives up and leaves.

### Ending 2: Offer Food to the Alien

**Required Stat:** Food ≥ 50

The player offers the alien a large supply of food.

The alien becomes satisfied and leaves the outpost without attacking.

### Ending 3: Overload the Power Station

**Required Stat:** Power ≥ 50

The player uses the outpost's powerful electrical system to overload the Power Station.

The alien destroys the Power Station during the encounter but is electrocuted by the resulting energy discharge and leaves.

### Ending 4: Evacuate the Outpost

**Required Stat:** Health ≥ 50

The player chooses to evacuate the team rather than fight the alien.

The team successfully returns to Earth safely.

### Bad Ending

If the player selects an ending strategy but does not meet its required stat threshold, the strategy fails.

The alien destroys the outpost again.

For example:
- A player has Shield 50 but chooses to offer Food with only 35 Food.
- The Food strategy fails.
- The player does not automatically receive the Shield ending.

This makes the final decision meaningful and encourages players to plan their resource investment from the beginning.

---

## 12. Visual and Interface Direction

The game should use a 2D visual style with a Martian environment.

The background should feature a red Mars landscape, with the outpost facilities placed within the environment.

The general visual design should make resource management easy to understand for children aged 7–12.

Suggested interface elements include:

- Core stat indicators for Food, Power, Shield, and Health.
- Separate Oxygen and Water indicators.
- AP counter.
- Day counter.
- Task interaction interface.
- Base Management panel.
- Daily report interface.
- Hazard warning interface.
- Character dialogue boxes.
- Final boss decision interface.

Facilities should be visually distinguishable so that players can identify their purposes easily.

Hazards and major events should be communicated through cutscenes, illustrations, animations, or clear visual indicators.

The game should avoid overwhelming players with complicated numerical information. Important changes should be explained through simple messages and visual feedback.

---

## 13. Design Principles

The following principles should guide development:

1. **Resource management:** Every resource should have a meaningful purpose and should affect the survival of the outpost.
2. **Strategic decision-making:** Players must choose which tasks are most important instead of upgrading everything.
3. **Short-term versus long-term planning:** Some tasks provide immediate benefits, while others require time before producing results.
4. **Meaningful consequences:** Poor resource management should have consequences, but players should have opportunities to recover.
5. **Accessibility:** Mechanics should be understandable to children aged 7–12.
6. **Replayability:** Random events and hazards should make different playthroughs feel different.
7. **Multiple endings:** Players should be able to choose different strategies based on how they managed their resources.

---

## 14. Current Design and Balancing Priorities

The following areas still require implementation decisions and playtesting.

### Resource Economy
- Finalise daily consumption and production rates.
- Determine exact Oxygen and Water consumption.
- Determine how facility efficiency changes when Power is low.
- Establish whether Shield has any passive daily decay or recovery.
- Establish maximum capacity limits and upgrade levels.

### AP Economy
- Confirm the 6 AP storage cap.
- Determine whether AP costs and task rewards are balanced across 15 days.
- Ensure players have enough AP for survival tasks while still having opportunities to upgrade their chosen ending stat.

### Hazard System
- Finalise hazard damage values.
- Determine whether facilities can be temporarily disabled or permanently damaged.
- Establish how defensive upgrades interact with different hazards.
- Ensure hazards are challenging but not unfair.

### Progression
- Determine facility prerequisites.
- Establish crop-growth duration and production.
- Determine how many times each upgrade can be purchased.
- Ensure players can realistically reach at least one ending requirement of 50 or more.

### Game Balance
The most important balancing objective is to ensure that a player can realistically survive 15 days while preparing for at least one successful ending.

The proposed numbers in this document should be treated as an initial prototype economy. They must be tested through simulated playthroughs and adjusted where necessary.

---

## 15. Overall Development Summary

Mars Outpost Survival is a 15-day 2D survival and resource-management game in which the player must rebuild a destroyed Martian outpost and protect its astronauts from environmental hazards and an alien threat.

Players receive 3 AP per day, which they spend on tasks such as repairing facilities, planting crops, installing solar panels, upgrading batteries, and reinforcing the habitat. Unused AP can be carried forward up to a maximum of 6.

The player must manage four main stats—Food, Power, Shield, and Health—alongside Oxygen and Water. These resources are interconnected, meaning that neglecting one resource can affect the entire outpost.

Every three days, a major hazard threatens the outpost, with advance warnings allowing players to prepare. Daily random events introduce additional variety.

On Day 15, the alien boss returns. The player must choose one of four strategies based on their strongest preparation: activate the Shield, offer Food, overload the Power Station, or evacuate using sufficient Health.

The overall experience should encourage children to think ahead, manage limited resources, understand interconnected systems, and experience the consequences of their decisions.

**Core gameplay concept: Survive, rebuild, manage resources, prepare for the unknown, and make the decisions that determine the fate of the Martian outpost.**