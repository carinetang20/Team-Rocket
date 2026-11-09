/**
 * Balance simulator — run many seeded playthroughs with simple strategies
 * to see win rates and which endings are reachable.
 *
 * Usage: npm run balance
 */
import { GameEngine } from "../src/engine/engine.js";
import { CONFIG } from "../src/engine/config.js";
import type { EndingId } from "../src/engine/types.js";

type Strategy = "food" | "power" | "shield" | "health" | "balanced" | "idle";

/** Survival baseline first, then specialize — mirrors how kids should play. */
const PRIORITY: Record<Strategy, string[]> = {
  food: [
    // Stack food first; light then full shielding so hunger still leads at boss.
    "plant_crops",
    "expand_greenhouse",
    "install_solar",
    "patch_shield",
    "emergency_ration_run",
    "reinforce_habitat",
    "repair_water",
    "repair_oxygen",
  ],
  power: [
    // Survive with patches; stack power hard so it leads at the boss.
    "install_solar",
    "patch_shield",
    "upgrade_batteries",
    "plant_crops",
    "reroute_power",
    "repair_oxygen",
  ],
  shield: [
    "reinforce_habitat",
    "build_radiation_shelter",
    "install_solar",
    "plant_crops",
    "repair_oxygen",
    "upgrade_batteries",
  ],
  health: [
    "repair_oxygen",
    "repair_water",
    "plant_crops",
    "install_solar",
    "build_radiation_shelter",
    "reinforce_habitat",
    "medic_room",
    "expand_greenhouse",
  ],
  balanced: [
    "plant_crops",
    "install_solar",
    "reinforce_habitat",
    "repair_oxygen",
    "expand_greenhouse",
    "upgrade_batteries",
    "build_radiation_shelter",
    "repair_water",
    "medic_room",
  ],
  idle: [],
};

async function play(seed: number, strategy: Strategy): Promise<EndingId> {
  const engine = new GameEngine({ seed, useCuratedWeather: true });
  await engine.startGame();

  for (let guard = 0; guard < 200; guard += 1) {
    const view = engine.getView();
    if (view.ending) return view.ending;

      if (view.phase === "hazard") {
      engine.acknowledgeHazard();
      continue;
    }

    if (view.phase === "acting") {
      const order = PRIORITY[strategy];
      let acted = false;
      for (const id of order) {
        const latest = engine.getView();
        const task = latest.availableTasks.find((t) => t.id === id);
        if (!task || latest.ap < task.apCost) continue;
        // Avoid dumping AP into already-full stats (e.g. patch_shield at max).
        if (id === "patch_shield" && latest.stats.shield.current >= latest.stats.shield.max - 1) {
          continue;
        }
        if (id === "emergency_ration_run" && latest.stats.hunger.current >= latest.stats.hunger.max - 2) {
          continue;
        }
        if (id === "reroute_power" && latest.stats.power.current >= latest.stats.power.max - 2) {
          continue;
        }
        if (id === "medic_room" && latest.stats.health.current >= latest.stats.health.max - 2) {
          continue;
        }
        const result = await engine.doTask(id);
        acted = true;
        if (result.state.ending) return result.state.ending;
        break;
      }
      if (!acted) {
        const result = await engine.sleep();
        if (result.state.ending) return result.state.ending;
      }
      continue;
    }

    break;
  }

  return engine.getView().ending ?? "game_over";
}

async function main(): Promise<void> {
  const runs = Number(process.argv[2] ?? 40);
  const strategies = Object.keys(PRIORITY) as Strategy[];
  console.log(`Team Rocket balance sim — ${runs} seeds × ${strategies.length} strategies`);
  console.log(`Ending threshold: ${CONFIG.endingThreshold}, max day: ${CONFIG.maxDays}\n`);

  for (const strategy of strategies) {
    const tallies: Partial<Record<EndingId, number>> = {};
    for (let i = 0; i < runs; i += 1) {
      const ending = await play(1000 + i * 17, strategy);
      tallies[ending] = (tallies[ending] ?? 0) + 1;
    }
    const line = Object.entries(tallies)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}:${v}`)
      .join("  ");
    const wins = runs - (tallies.game_over ?? 0) - (tallies.bad ?? 0);
    console.log(
      `${strategy.padEnd(9)} winish=${wins}/${runs}  ${line}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
