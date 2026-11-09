import { CONFIG } from "./config.js";
import { addStat, deathReason, effectiveProduction, isDead } from "./stats.js";
import type { GameState } from "./types.js";

export interface SleepResult {
  messages: string[];
  gameOver: boolean;
  gameOverReason?: string;
}

/**
 * End-of-day resolution:
 * 1) daily decay
 * 2) production income (power-shortage penalty applied)
 * 3) low-hunger health drain
 * 4) lose if any core stat hits 0
 */
export function resolveSleep(state: GameState): SleepResult {
  const messages: string[] = ["Night falls on the outpost..."];
  const { stats, production } = state;

  // 1. Decay
  for (const [stat, amount] of Object.entries(CONFIG.dailyDecay) as [
    keyof typeof CONFIG.dailyDecay,
    number,
  ][]) {
    addStat(stats, stat, -amount);
    messages.push(`Daily wear: ${stat} -${amount}`);
  }

  // 2. Production
  const effective = effectiveProduction(stats, production);
  if (stats.power.current < CONFIG.lowPowerThreshold) {
    messages.push(
      `Power below ${CONFIG.lowPowerThreshold}: food & oxygen systems at ${CONFIG.lowPowerProductionPenalty * 100}% efficiency.`,
    );
  }

  const gains: Array<[keyof typeof effective, "hunger" | "power" | "shield" | "health"]> = [
    ["foodPerDay", "hunger"],
    ["powerPerDay", "power"],
    ["shieldPerDay", "shield"],
    ["oxygenPerDay", "health"],
  ];

  for (const [rateKey, stat] of gains) {
    const gain = Math.round(effective[rateKey]);
    if (gain > 0) {
      addStat(stats, stat, gain);
      messages.push(`Systems produce: ${stat} +${gain}`);
    }
  }

  // 3. Low hunger consequence
  if (stats.hunger.current < CONFIG.lowHungerThreshold) {
    addStat(stats, "health", -CONFIG.lowHungerHealthLoss);
    messages.push(
      `Hunger below ${CONFIG.lowHungerThreshold}: crew weakens, Health -${CONFIG.lowHungerHealthLoss}.`,
    );
  }

  // Carry leftover AP into tomorrow, capped
  const carried = Math.min(state.ap, CONFIG.maxSavedAp);
  if (state.ap > CONFIG.maxSavedAp) {
    messages.push(`Could only save ${CONFIG.maxSavedAp} AP (cap reached).`);
  } else if (carried > 0) {
    messages.push(`Saved ${carried} AP for tomorrow.`);
  }
  state.ap = carried;

  if (isDead(stats)) {
    return {
      messages,
      gameOver: true,
      gameOverReason: deathReason(stats),
    };
  }

  return { messages, gameOver: false };
}
