import type { GameState } from '../contract/types';

/** Seeded random in [0, 1). Advances state.rngState (mulberry32). */
export function rand(state: GameState): number {
  state.rngState = (state.rngState + 0x6d2b79f5) >>> 0;
  let t = state.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function pickIndex(state: GameState, length: number): number {
  if (length <= 0) return 0;
  return Math.floor(rand(state) * length);
}
