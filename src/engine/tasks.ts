import { CONFIG } from "./config.js";
import { addStat, raiseMax } from "./stats.js";
import type {
  FacilityFlags,
  GameState,
  ProductionRates,
  TaskDefinition,
} from "./types.js";

/**
 * Every task has a real trade-off (AP cost + often a stat/production cost).
 * Immediate tasks help now; upgrade / delayed tasks invest for later days.
 */
export const TASKS: readonly TaskDefinition[] = [
  {
    id: "repair_oxygen",
    name: "Repair oxygen generator",
    category: "life_support",
    description: "Fix the oxygen machines so the crew can breathe easier.",
    apCost: 2,
    kidTip: "Costs power to run the tools, but health recovers faster each day.",
    once: true,
    effects: [
      { setFlag: "oxygenGeneratorRepaired" },
      { production: "oxygenPerDay", productionDelta: 3 },
      { raiseMax: "health", raiseMaxBy: 10 },
      { stat: "health", delta: 6 },
      { stat: "power", delta: -3 },
    ],
  },
  {
    id: "repair_water",
    name: "Repair water recycler",
    category: "life_support",
    description: "Clean and fix the water recycler so less water is wasted.",
    apCost: 1,
    kidTip: "Uses a little power now; keeps health from dropping as fast.",
    once: true,
    effects: [
      { setFlag: "waterRecyclerRepaired" },
      { production: "oxygenPerDay", productionDelta: 2 },
      { stat: "health", delta: 4 },
      { stat: "power", delta: -1 },
    ],
  },
  {
    id: "install_solar",
    name: "Install solar panels",
    category: "power",
    description: "Add more solar panels so the outpost makes more electricity.",
    apCost: 2,
    kidTip: "Takes food-time from the crew today, but power grows every day after.",
    once: true,
    effects: [
      { setFlag: "solarPanelsInstalled" },
      { production: "powerPerDay", productionDelta: 4 },
      { raiseMax: "power", raiseMaxBy: 10 },
      { stat: "power", delta: 8 },
      { stat: "hunger", delta: -2 },
    ],
  },
  {
    id: "upgrade_batteries",
    name: "Upgrade batteries",
    category: "power",
    description: "Bigger batteries mean you can store more power.",
    apCost: 2,
    kidTip: "Raises your power max. Costs shield materials to build the casing.",
    once: true,
    effects: [
      { setFlag: "batteriesUpgraded" },
      { raiseMax: "power", raiseMaxBy: 20 },
      { production: "powerPerDay", productionDelta: 3 },
      { stat: "power", delta: 12 },
      { stat: "shield", delta: -2 },
    ],
  },
  {
    id: "reinforce_habitat",
    name: "Reinforce habitat",
    category: "shielding",
    description: "Strengthen walls against dust, meteors, and radiation.",
    apCost: 2,
    kidTip: "Burns power for the welders. Shield goes up now and each day.",
    once: true,
    effects: [
      { setFlag: "habitatReinforced" },
      { production: "shieldPerDay", productionDelta: 3 },
      { raiseMax: "shield", raiseMaxBy: 20 },
      { stat: "shield", delta: 12 },
      { stat: "power", delta: -3 },
    ],
  },
  {
    id: "build_radiation_shelter",
    name: "Build radiation shelter",
    category: "shielding",
    description: "A safe room that cuts radiation damage during storms.",
    apCost: 2,
    kidTip: "Uses food stores for the work crew. Big shield boost + health safety.",
    once: true,
    effects: [
      { setFlag: "radiationShelterBuilt" },
      { production: "shieldPerDay", productionDelta: 2 },
      { raiseMax: "shield", raiseMaxBy: 15 },
      { raiseMax: "health", raiseMaxBy: 15 },
      { stat: "shield", delta: 8 },
      { stat: "health", delta: 8 },
      { production: "oxygenPerDay", productionDelta: 1 },
      { stat: "hunger", delta: -3 },
    ],
  },
  {
    id: "plant_crops",
    name: "Plant crops",
    category: "food",
    description: "Plant seeds in the greenhouse for future meals.",
    apCost: 1,
    kidTip: "Uses power for grow-lights. Food income starts tomorrow.",
    once: true,
    effects: [
      { setFlag: "cropsPlanted" },
      { production: "foodPerDay", productionDelta: 3 },
      { stat: "hunger", delta: 4 },
      { stat: "power", delta: -2 },
    ],
  },
  {
    id: "expand_greenhouse",
    name: "Expand greenhouse",
    category: "food",
    description: "Make the greenhouse bigger so more food can grow.",
    apCost: 2,
    kidTip: "Raises food max and daily harvest. Costs power and some shield parts.",
    once: true,
    requires: "cropsPlanted",
    effects: [
      { setFlag: "greenhouseExpanded" },
      { production: "foodPerDay", productionDelta: 5 },
      { raiseMax: "hunger", raiseMaxBy: 25 },
      { raiseMax: "health", raiseMaxBy: 10 },
      { stat: "hunger", delta: 12 },
      { stat: "power", delta: -3 },
      { stat: "shield", delta: -1 },
    ],
  },
  {
    id: "emergency_ration_run",
    name: "Emergency ration run",
    category: "food",
    description: "Raid the emergency pantry for food right now.",
    apCost: 1,
    kidTip: "Quick hunger boost, but you burn power hauling crates and lose some shield scrap.",
    effects: [
      { stat: "hunger", delta: 8 },
      { stat: "power", delta: -2 },
      { stat: "shield", delta: -1 },
    ],
  },
  {
    id: "patch_shield",
    name: "Patch shield panels",
    category: "shielding",
    description: "Quick repairs to keep the barrier holding — not a full upgrade.",
    apCost: 1,
    kidTip: "Small shield top-up. Costs power. Won't alone win the shield ending.",
    effects: [
      { stat: "shield", delta: 5 },
      { stat: "power", delta: -2 },
    ],
  },
  {
    id: "reroute_power",
    name: "Reroute emergency power",
    category: "power",
    description: "Divert power from shields to keep systems online today.",
    apCost: 1,
    kidTip: "Instant power, but shields dip — a real engineering trade-off.",
    effects: [
      { stat: "power", delta: 7 },
      { stat: "shield", delta: -4 },
    ],
  },
  {
    id: "medic_room",
    name: "Visit medic room",
    category: "life_support",
    description: "Quick treatment in the medic bay for crew health.",
    apCost: CONFIG.medicRoomApCost,
    kidTip: "Heals now, but uses medical supplies that could have been food stock.",
    effects: [
      { stat: "health", delta: CONFIG.medicRoomHeal },
      { stat: "hunger", delta: -2 },
    ],
  },
  {
    id: "feed_meowth",
    name: "Feed Meowth",
    category: "special",
    description: "Share a snack with Meowth. Keep it up for a surprise!",
    apCost: 1,
    kidTip: "Costs a little food. After enough snacks, Meowth brings a big gift.",
    effects: [{ meowthFeed: 1 }, { stat: "hunger", delta: -1 }],
  },
];

export function listAvailableTasks(state: GameState): TaskDefinition[] {
  return TASKS.filter((task) => {
    if (task.once && state.completedTasks.includes(task.id)) return false;
    if (task.requires && !state.flags[task.requires]) return false;
    if (task.id === "feed_meowth" && state.meowthRewardClaimed) return false;
    return true;
  });
}

export function applyTaskEffects(
  task: TaskDefinition,
  stats: GameState["stats"],
  production: ProductionRates,
  flags: FacilityFlags,
  meowth: { hunger: number; claimed: boolean },
): string[] {
  const messages: string[] = [];

  for (const effect of task.effects) {
    if (effect.setFlag) {
      flags[effect.setFlag] = true;
      messages.push(`Facility ready: ${effect.setFlag}`);
    }
    if (effect.production && effect.productionDelta) {
      production[effect.production] += effect.productionDelta;
      messages.push(
        `Daily ${effect.production} +${effect.productionDelta}`,
      );
    }
    if (effect.raiseMax && effect.raiseMaxBy) {
      raiseMax(stats, effect.raiseMax, effect.raiseMaxBy);
      messages.push(`${effect.raiseMax} max +${effect.raiseMaxBy}`);
    }
    if (effect.stat && typeof effect.delta === "number") {
      const applied = addStat(stats, effect.stat, effect.delta);
      const sign = applied >= 0 ? "+" : "";
      messages.push(`${effect.stat} ${sign}${applied}`);
    }
    if (effect.meowthFeed) {
      meowth.hunger += effect.meowthFeed;
      messages.push(`Meowth snacks: ${meowth.hunger}/${CONFIG.meowthFeedNeeded}`);
      if (!meowth.claimed && meowth.hunger >= CONFIG.meowthFeedNeeded) {
        meowth.claimed = true;
        for (const [stat, amount] of Object.entries(CONFIG.meowthReward) as [
          keyof typeof CONFIG.meowthReward,
          number,
        ][]) {
          addStat(stats, stat, amount);
          messages.push(`Meowth gift! ${stat} +${amount}`);
        }
      }
    }
  }

  return messages;
}
