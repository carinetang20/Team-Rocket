import { CONFIG } from '../config/gameConfig';
import type { EngineRules, GameEngine } from '../contract/engine';
import { STRATEGY_STAT } from '../contract/engine';
import type {
  FacilityId,
  FacilityState,
  GameState,
  StepResult,
  Strategy,
  TaskId,
} from '../contract/types';
import { FACILITY_IDS } from '../contract/types';
import { resolveStartDay } from './day';
import { cloneState } from './resources';
import { resolveSleep } from './sleep';
import { applyTask, getTask, TASK_LIST, toTaskView } from './tasks';

const RULES: EngineRules = {
  finalDay: CONFIG.finalDay,
  endingRequired: CONFIG.endingRequired,
  lifeSupportThreshold: CONFIG.lifeSupportThreshold,
};

function makeFacility(id: FacilityId): FacilityState {
  const def = CONFIG.startingFacilities[id];
  return {
    id,
    status: def.status,
    level: 1,
    producesPerDay: { ...def.producesPerDay },
    powerUse: def.powerUse,
  };
}

function createInitialState(seed: number): GameState {
  const resources = {
    food: { ...CONFIG.startingResources.food },
    power: { ...CONFIG.startingResources.power },
    shield: { ...CONFIG.startingResources.shield },
    health: { ...CONFIG.startingResources.health },
    oxygen: { ...CONFIG.startingResources.oxygen },
    water: { ...CONFIG.startingResources.water },
  };

  const facilities = {} as GameState['facilities'];
  for (const id of FACILITY_IDS) {
    facilities[id] = makeFacility(id);
  }

  return {
    version: CONFIG.saveVersion,
    seed,
    rngState: seed >>> 0,
    day: 1,
    phase: 'playing',
    ap: CONFIG.apPerDay,
    apCap: CONFIG.apCap,
    resources,
    facilities,
    upgrades: {},
    crops: [],
    upcoming: null,
    lowStreaks: { food: 0, water: 0, oxygen: 0 },
    stats: {
      daysSurvived: 0,
      tasksCompleted: 0,
      apSpent: 0,
      hazardsSurvived: 0,
      damageBlocked: 0,
    },
    deathCause: null,
    outcome: null,
  };
}

/** Person A — real rules engine. Implements the shared GameEngine contract. */
export function createEngine(): GameEngine {
  return {
    rules: RULES,

    newGame(options = {}): StepResult {
      const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
      const state = createInitialState(seed);
      return {
        state,
        events: [
          {
            type: 'dayStarted',
            day: 1,
            apGranted: CONFIG.apPerDay,
            apTotal: state.ap,
            apLostToCap: 0,
          },
        ],
      };
    },

    getTasks(state) {
      return TASK_LIST.map((t) => toTaskView(state, t));
    },

    doTask(state, taskId: TaskId): StepResult {
      const task = getTask(taskId);
      if (!task) {
        return { state, events: [{ type: 'taskRejected', taskId, reason: 'Unknown task.' }] };
      }
      const view = toTaskView(state, task);
      if (!view.available) {
        return {
          state,
          events: [
            {
              type: 'taskRejected',
              taskId,
              reason: view.lockedReason ?? 'Not possible right now.',
            },
          ],
        };
      }

      const s = cloneState(state);
      s.ap -= task.apCost;
      s.upgrades[task.id] = (s.upgrades[task.id] ?? 0) + 1;
      const changes = applyTask(s, task);
      s.stats.tasksCompleted += 1;
      s.stats.apSpent += task.apCost;

      return {
        state: s,
        events: [
          {
            type: 'taskCompleted',
            taskId,
            name: task.name,
            apSpent: task.apCost,
            newLevel: s.upgrades[task.id] ?? 1,
            changes,
          },
        ],
      };
    },

    sleep: resolveSleep,
    startDay: resolveStartDay,

    chooseStrategy(state, strategy: Strategy): StepResult {
      if (state.phase !== 'playing' || state.day < CONFIG.finalDay) {
        return { state, events: [] };
      }
      const s = cloneState(state);
      const actual = s.resources[STRATEGY_STAT[strategy]].current;
      const required = CONFIG.endingRequired;
      const success = actual >= required;
      s.phase = success ? 'won' : 'lost';
      s.outcome = { result: success ? 'win' : 'bad', strategy, required, actual };
      s.stats.daysSurvived = CONFIG.finalDay;
      return {
        state: s,
        events: [{ type: 'bossResolved', strategy, required, actual, success }],
      };
    },

    serialize(state) {
      return JSON.stringify(state);
    },

    deserialize(text) {
      const parsed = JSON.parse(text) as GameState;
      if (parsed?.version !== CONFIG.saveVersion) {
        throw new Error('Save is from a different version.');
      }
      return parsed;
    },
  };
}
