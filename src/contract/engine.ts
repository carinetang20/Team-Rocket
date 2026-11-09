// SHARED CONTRACT — the engine interface the UI talks to. See docs/contract.md.
// Person A's real engine (src/engine/) and the temporary fake engine (src/fake-engine/) both implement this.

import type { CoreStatId, GameState, StepResult, Strategy, TaskId, TaskView } from './types';

/** Rule values the UI needs to display (so screens never hard-code numbers). Come from the config. */
export interface EngineRules {
  finalDay: number;
  endingRequired: number;
  lifeSupportThreshold: number;
}

export interface GameEngine {
  readonly rules: EngineRules;
  newGame(options?: { seed?: number }): StepResult;
  getTasks(state: GameState): TaskView[];
  doTask(state: GameState, taskId: TaskId): StepResult;
  /** Night resolution. Valid on days before the final day. Does not start the next day. */
  sleep(state: GameState): StepResult;
  /**
   * Start the next day after a survived night. When this reaches the final day, no AP is
   * granted and a `bossArrived` event is emitted instead of the normal morning events.
   */
  startDay(state: GameState): StepResult;
  /** Final day only (after `bossArrived`): resolve the boss. */
  chooseStrategy(state: GameState, strategy: Strategy): StepResult;
  serialize(state: GameState): string;
  /** Throws if the save is unreadable or from an incompatible version. */
  deserialize(text: string): GameState;
}

/** Which stat each final strategy checks (design doc §11). */
export const STRATEGY_STAT: Record<Strategy, CoreStatId> = {
  shield: 'shield',
  food: 'food',
  power: 'power',
  evacuate: 'health',
};
