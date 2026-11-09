import {
  CONFIG,
  createStartingProduction,
  createStartingStats,
} from "./config.js";
import type { FacilityFlags, GameState } from "./types.js";

export function createFacilityFlags(): FacilityFlags {
  return {
    oxygenGeneratorRepaired: false,
    waterRecyclerRepaired: false,
    solarPanelsInstalled: false,
    batteriesUpgraded: false,
    habitatReinforced: false,
    radiationShelterBuilt: false,
    greenhouseExpanded: false,
    cropsPlanted: false,
  };
}

export function createInitialState(seed = Date.now()): GameState {
  return {
    version: 1,
    seed,
    phase: "boot",
    day: 0,
    maxDays: CONFIG.maxDays,
    ap: 0,
    apCap: CONFIG.maxSavedAp,
    stats: createStartingStats(),
    production: createStartingProduction(),
    flags: createFacilityFlags(),
    completedTasks: [],
    meowthHunger: 0,
    meowthRewardClaimed: false,
    lastReport: null,
    activeHazard: null,
    hazardApplied: false,
    hazardHistory: [],
    warnedHazard: null,
    log: ["Welcome to the Team Rocket Martian outpost."],
    ending: null,
    spaceWeather: null,
  };
}

export function pushLog(state: GameState, messages: string[]): void {
  state.log.push(...messages);
  // Keep log bounded for save size
  if (state.log.length > 200) {
    state.log = state.log.slice(-200);
  }
}
