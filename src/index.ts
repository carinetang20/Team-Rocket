/** Person A — public game-logic API for Person B / UI. */

export { GameEngine } from "./engine/engine.js";
export type { EngineOptions } from "./engine/engine.js";

export { CONFIG } from "./engine/config.js";
export { TASKS, listAvailableTasks } from "./engine/tasks.js";
export { RANDOM_EVENTS, RANDOM_EVENT_IDS } from "./engine/events.js";
export { HAZARDS, HAZARD_IDS, isHazardDay } from "./engine/hazards.js";
export { resolveBoss } from "./engine/boss.js";
export { serializeState, deserializeState } from "./engine/save.js";
export { createInitialState } from "./engine/state.js";

export {
  fetchSpaceWeather,
  getCuratedSpaceWeather,
  DONKI_ATTRIBUTION,
} from "./data/nasa/donki.js";

export type {
  ActionResult,
  DailyReport,
  EndingId,
  FacilityFlags,
  GamePhase,
  GameState,
  HazardId,
  ProductionRates,
  PublicView,
  RandomEventId,
  SpaceWeatherSnapshot,
  StatId,
  Stats,
  TaskCategory,
  TaskDefinition,
} from "./engine/types.js";
