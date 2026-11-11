// SHARED CONTRACT — owned jointly by Person A (logic) and Person B (flow).
// Human-readable version: docs/contract.md. Change only with agreement from A and B.

// ---------- Identifiers ----------

export type ResourceId = 'food' | 'power' | 'shield' | 'health' | 'oxygen' | 'water';
/** The four stats that unlock endings. */
export type CoreStatId = 'food' | 'power' | 'shield' | 'health';
/** Resources that hurt Health when below the survival threshold. */
export type LifeSupportId = 'food' | 'water' | 'oxygen';

export type FacilityId =
  | 'mainBase'
  | 'shieldGenerator'
  | 'powerStation'
  | 'greenhouse'
  | 'oxygenGenerator'
  | 'waterRecycler';

export type FacilityStatus = 'operational' | 'damaged' | 'unpowered' | 'growing';
export type Strategy = 'shield' | 'food' | 'power' | 'evacuate';
export type TaskCategory = 'lifeSupport' | 'power' | 'shielding' | 'food';

/** Defined in the game config (Person A); may be added/renamed there. */
export type TaskId = string;
export type HazardId = string;
export type RandomEventId = string;

export const RESOURCE_IDS: readonly ResourceId[] = ['food', 'power', 'shield', 'health', 'oxygen', 'water'];
export const CORE_STAT_IDS: readonly CoreStatId[] = ['food', 'power', 'shield', 'health'];
export const LIFE_SUPPORT_IDS: readonly LifeSupportId[] = ['food', 'water', 'oxygen'];
export const FACILITY_IDS: readonly FacilityId[] = [
  'mainBase',
  'shieldGenerator',
  'powerStation',
  'greenhouse',
  'oxygenGenerator',
  'waterRecycler',
];
export const STRATEGIES: readonly Strategy[] = ['shield', 'food', 'power', 'evacuate'];

// ---------- State ----------

export interface ResourceValue {
  current: number;
  max: number;
}

export interface FacilityState {
  id: FacilityId;
  status: FacilityStatus;
  level: number;
  /** What this facility makes each night when operational. */
  producesPerDay: Partial<Record<ResourceId, number>>;
  /** Power used each night while it is running. */
  powerUse: number;
}

export interface CropBatch {
  readyOnDay: number;
  amount: number;
}

export interface UpcomingThreat {
  day: number;
  kind: 'hazard' | 'boss';
  hazardId?: HazardId;
  hazardName?: string;
}

export interface RunStats {
  daysSurvived: number;
  tasksCompleted: number;
  apSpent: number;
  hazardsSurvived: number;
  damageBlocked: number;
}

export interface DeathCause {
  lowResources: { resource: LifeSupportId; nightsBelow: number }[];
  finalBlow: 'lowResources' | 'hazard';
  hazardId?: HazardId;
  hazardName?: string;
}

export interface Outcome {
  result: 'win' | 'bad' | 'dead';
  strategy?: Strategy;
  required?: number;
  actual?: number;
}

export type GamePhase = 'playing' | 'won' | 'lost' | 'dead';

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  day: number;
  phase: GamePhase;
  ap: number;
  apCap: number;
  resources: Record<ResourceId, ResourceValue>;
  facilities: Record<FacilityId, FacilityState>;
  /** How many times each task has been done. */
  upgrades: Record<TaskId, number>;
  crops: CropBatch[];
  upcoming: UpcomingThreat | null;
  /** Consecutive nights each life-support resource ended below the threshold. */
  lowStreaks: Record<LifeSupportId, number>;
  stats: RunStats;
  deathCause: DeathCause | null;
  outcome: Outcome | null;
}

// ---------- Events ----------

export interface ResourceChange {
  resource: ResourceId;
  delta: number;
  field: 'current' | 'max';
  reason: string;
}

export interface HazardDamage {
  resource: ResourceId;
  base: number;
  final: number;
  blockedBy: { taskId: TaskId; name: string; amount: number }[];
}

export type EngineEvent =
  | { type: 'dayStarted'; day: number; apGranted: number; apTotal: number; apLostToCap: number }
  | {
      type: 'randomEvent';
      eventId: RandomEventId;
      name: string;
      message: string;
      positive: boolean;
      changes: ResourceChange[];
    }
  | { type: 'warning'; kind: 'hazard' | 'boss'; day: number; hazardId?: HazardId; hazardName?: string; hint?: string }
  | { type: 'lowResourceWarning'; resource: LifeSupportId; nightsBelow: number }
  | { type: 'taskCompleted'; taskId: TaskId; name: string; apSpent: number; newLevel: number; changes: ResourceChange[] }
  | { type: 'taskRejected'; taskId: TaskId; reason: string }
  | { type: 'hazardStruck'; hazardId: HazardId; name: string; description: string; damage: HazardDamage[] }
  | { type: 'consumption'; changes: ResourceChange[] }
  | { type: 'powerShortage'; shortfall: number; facilitiesOff: FacilityId[] }
  | { type: 'facilityStatusChanged'; facility: FacilityId; from: FacilityStatus; to: FacilityStatus; reason: string }
  | { type: 'production'; changes: ResourceChange[] }
  | { type: 'cropsReady'; amount: number }
  | {
      type: 'healthChanged';
      delta: number;
      reason: 'allHealthy' | 'oneLow' | 'manyLow' | 'hazard';
      lowResources: LifeSupportId[];
    }
  | { type: 'gameOver'; cause: DeathCause }
  | { type: 'nightEnded'; day: number }
  /** The final day has begun: no AP, the boss arrives immediately (decision D1). */
  | { type: 'bossArrived'; day: number }
  | { type: 'bossResolved'; strategy: Strategy; required: number; actual: number; success: boolean };

export type EngineEventType = EngineEvent['type'];
export type EventOf<T extends EngineEventType> = Extract<EngineEvent, { type: T }>;

// ---------- Views & results ----------

/** What a task will change — shown on the task card before the player spends AP. */
export interface TaskEffectPreview {
  /** Resource touched, if any (omit for plain info like "starts working"). */
  resource?: ResourceId;
  /** Signed amount (+gain / −cost). 0 when `kind` is `info`. */
  delta: number;
  /**
   * `now` = changes immediately; `max` = raises capacity; `perDay` = nightly production;
   * `delayed` = arrives later (see `readyInDays`); `info` = short status text in `note`.
   */
  kind: 'now' | 'max' | 'perDay' | 'delayed' | 'info';
  readyInDays?: number;
  note?: string;
}

export interface TaskView {
  id: TaskId;
  name: string;
  description: string;
  category: TaskCategory;
  facility: FacilityId;
  apCost: number;
  level: number;
  /** null = no limit. */
  maxLevel: number | null;
  available: boolean;
  /** Kid-friendly reason the task can't be done right now. */
  lockedReason?: string;
  /** Resource costs/gains (and similar) so the UI can show +/− before clicking. */
  effects: TaskEffectPreview[];
}

export interface StepResult {
  state: GameState;
  events: EngineEvent[];
}
