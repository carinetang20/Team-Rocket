import type { ProductionRates, Stats } from "./types.js";

/** Tunable balance knobs — Person A owns these. */
export const CONFIG = {
  maxDays: 15,
  startingAp: 3,
  dailyApGrant: 3,
  maxSavedAp: 6,
  startingStat: 12,
  startingMax: 50,
  endingThreshold: 50,

  /** Passive drain applied each sleep before production. */
  dailyDecay: {
    hunger: 2,
    power: 2,
    shield: 1,
    health: 0,
  },

  /** Extra health loss when hunger is critically low. */
  lowHungerHealthLoss: 2,
  lowHungerThreshold: 5,

  /** Power shortage makes food/oxygen production less effective. */
  lowPowerThreshold: 5,
  lowPowerProductionPenalty: 0.5,

  /** Shield mitigation vs hazards (fraction of damage blocked per shield point). */
  shieldMitigationPerPoint: 0.015,
  maxShieldMitigation: 0.75,

  /** Extra health damage during hazards when shield is low. */
  lowShieldThreshold: 5,
  lowShieldExtraHealthLoss: 2,

  hazardDays: [3, 6, 9, 12] as readonly number[],
  bossDay: 15,

  /** Meowth: feed enough times for a strong one-shot buff. */
  meowthFeedNeeded: 3,
  meowthReward: {
    hunger: 8,
    power: 8,
    shield: 8,
    health: 8,
  },

  medicRoomHeal: 6,
  medicRoomApCost: 1,
} as const;

export function createStartingStats(): Stats {
  const make = () => ({
    current: CONFIG.startingStat,
    max: CONFIG.startingMax,
  });
  return {
    hunger: make(),
    power: make(),
    shield: make(),
    health: make(),
  };
}

export function createStartingProduction(): ProductionRates {
  return {
    foodPerDay: 2,
    powerPerDay: 2,
    shieldPerDay: 1,
    oxygenPerDay: 1,
  };
}
