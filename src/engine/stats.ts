import { CONFIG } from "./config.js";
import type { ProductionRates, StatId, Stats } from "./types.js";

export function clampStat(stats: Stats, id: StatId): void {
  const s = stats[id];
  s.current = Math.max(0, Math.min(s.max, s.current));
}

export function clampAll(stats: Stats): void {
  (Object.keys(stats) as StatId[]).forEach((id) => clampStat(stats, id));
}

export function addStat(stats: Stats, id: StatId, delta: number): number {
  const before = stats[id].current;
  stats[id].current += delta;
  clampStat(stats, id);
  return stats[id].current - before;
}

export function raiseMax(stats: Stats, id: StatId, amount: number): void {
  stats[id].max += amount;
}

export function isDead(stats: Stats): boolean {
  return stats.health.current <= 0 || stats.hunger.current <= 0 || stats.power.current <= 0 || stats.shield.current <= 0;
}

export function deathReason(stats: Stats): string {
  if (stats.health.current <= 0) return "Crew health reached zero. Mission failed.";
  if (stats.hunger.current <= 0) return "Food stores empty. The crew cannot continue.";
  if (stats.power.current <= 0) return "Power failed. Life support shut down.";
  if (stats.shield.current <= 0) return "Shields collapsed. The outpost is unprotected.";
  return "Mission failed.";
}

/** Effective production after power-shortage penalty. */
export function effectiveProduction(stats: Stats, production: ProductionRates): ProductionRates {
  const lowPower = stats.power.current < CONFIG.lowPowerThreshold;
  const factor = lowPower ? CONFIG.lowPowerProductionPenalty : 1;
  return {
    foodPerDay: production.foodPerDay * factor,
    powerPerDay: production.powerPerDay,
    shieldPerDay: production.shieldPerDay,
    oxygenPerDay: production.oxygenPerDay * factor,
  };
}

export function shieldMitigation(stats: Stats): number {
  return Math.min(
    CONFIG.maxShieldMitigation,
    stats.shield.current * CONFIG.shieldMitigationPerPoint,
  );
}

/** Apply raw damage reduced by shielding. Returns actual amount applied (negative). */
export function applyMitigatedDamage(
  stats: Stats,
  target: StatId,
  rawLoss: number,
): number {
  const mitigation = shieldMitigation(stats);
  const loss = Math.max(0, Math.round(rawLoss * (1 - mitigation)));
  return addStat(stats, target, -loss);
}
