/** Core resource stats for the Mars outpost. */
export type StatId = "hunger" | "power" | "shield" | "health";

export type TaskCategory =
  | "life_support"
  | "power"
  | "shielding"
  | "food"
  | "special";

export type GamePhase =
  | "boot"
  | "day_start"
  | "acting"
  | "hazard"
  | "boss"
  | "ended";

export type EndingId =
  | "shield"
  | "food"
  | "power"
  | "health"
  | "bad"
  | "game_over";

export interface StatValue {
  current: number;
  max: number;
}

export type Stats = Record<StatId, StatValue>;

export interface FacilityFlags {
  oxygenGeneratorRepaired: boolean;
  waterRecyclerRepaired: boolean;
  solarPanelsInstalled: boolean;
  batteriesUpgraded: boolean;
  habitatReinforced: boolean;
  radiationShelterBuilt: boolean;
  greenhouseExpanded: boolean;
  cropsPlanted: boolean;
}

export interface ProductionRates {
  /** Hunger recovered each sleep from food systems. */
  foodPerDay: number;
  /** Power recovered each sleep from generators. */
  powerPerDay: number;
  /** Shield recovered each sleep from shielding systems. */
  shieldPerDay: number;
  /** Health recovered each sleep from life-support systems. */
  oxygenPerDay: number;
}

export interface TaskDefinition {
  id: string;
  name: string;
  category: TaskCategory;
  description: string;
  apCost: number;
  /** Plain-language tip for ages 7–12. */
  kidTip: string;
  /** Immediate / delayed effects applied when the task succeeds. */
  effects: TaskEffect[];
  /** Optional one-shot unlock gate. */
  once?: boolean;
  /** Required facility flag before the task appears. */
  requires?: keyof FacilityFlags;
}

export interface TaskEffect {
  /** Stat delta applied immediately (can be negative = trade-off). */
  stat?: StatId;
  delta?: number;
  /** Raise the max for a stat (upgrade tasks). */
  raiseMax?: StatId;
  raiseMaxBy?: number;
  /** Bump a daily production rate. */
  production?: keyof ProductionRates;
  productionDelta?: number;
  /** Set a facility flag. */
  setFlag?: keyof FacilityFlags;
  /** Feed Meowth progress (special). */
  meowthFeed?: number;
}

export type RandomEventId =
  | "oxygen_leak"
  | "underground_ice"
  | "equipment_malfunction"
  | "supply_discovery"
  | "alien_discovery";

export interface RandomEventDefinition {
  id: RandomEventId;
  name: string;
  description: string;
  severity: "good" | "bad" | "mixed";
  apply: (stats: Stats, production: ProductionRates, flags: FacilityFlags) => string[];
}

export type HazardId =
  | "oxygen_leak"
  | "water_contamination"
  | "solar_flare"
  | "generator_malfunction"
  | "dust_storm"
  | "meteor_shower"
  | "alien_invasion"
  | "crop_infestation";

export interface HazardDefinition {
  id: HazardId;
  name: string;
  category: TaskCategory;
  description: string;
  /** Base damage before shield mitigation. */
  apply: (
    stats: Stats,
    production: ProductionRates,
    flags: FacilityFlags,
    spaceWeatherMultiplier: number,
  ) => string[];
}

export interface SpaceWeatherSnapshot {
  source: "live" | "curated";
  fetchedAt: string;
  attribution: string;
  flareCount: number;
  cmeCount: number;
  sepCount: number;
  /** 1.0 = calm; higher = harsher radiation/hazards. */
  severityMultiplier: number;
  summary: string;
  events: SpaceWeatherEvent[];
}

export interface SpaceWeatherEvent {
  type: "FLR" | "CME" | "SEP" | "GST";
  id: string;
  startTime: string;
  note: string;
}

export interface DailyReport {
  day: number;
  randomEvent: RandomEventId | null;
  randomEventMessages: string[];
  upcomingHazard: HazardId | null;
  spaceWeather: SpaceWeatherSnapshot | null;
}

export interface ActionResult {
  ok: boolean;
  reason?: string;
  messages: string[];
  state: GameState;
}

export interface GameState {
  version: 1;
  seed: number;
  phase: GamePhase;
  day: number;
  maxDays: number;
  ap: number;
  apCap: number;
  stats: Stats;
  production: ProductionRates;
  flags: FacilityFlags;
  completedTasks: string[];
  meowthHunger: number;
  meowthRewardClaimed: boolean;
  lastReport: DailyReport | null;
  activeHazard: HazardId | null;
  /** True after today's hazard damage has been applied once. */
  hazardApplied: boolean;
  hazardHistory: HazardId[];
  warnedHazard: HazardId | null;
  log: string[];
  ending: EndingId | null;
  spaceWeather: SpaceWeatherSnapshot | null;
}

export interface PublicView {
  phase: GamePhase;
  day: number;
  maxDays: number;
  ap: number;
  apCap: number;
  stats: Stats;
  availableTasks: TaskDefinition[];
  lastReport: DailyReport | null;
  activeHazard: HazardId | null;
  warnedHazard: HazardId | null;
  ending: EndingId | null;
  endingBlurb: string | null;
  canSleep: boolean;
  canAct: boolean;
  spaceWeather: SpaceWeatherSnapshot | null;
  logTail: string[];
}
