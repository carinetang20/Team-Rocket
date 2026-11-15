// Sound manifest — owned by Person B. Human-readable version: docs/asset-list.md (keep both in sync).
//
// Every sound effect the game plays. Files go in public/assets/<file>. A missing file is simply
// skipped (silence), so sounds can be replaced or added with no code changes.
// The current files are generated retro synth placeholders: swap in better ones with the same name.

export type SoundId =
  | 'click'
  | 'open'
  | 'close'
  | 'denied'
  | 'upgrade'
  | 'fixed'
  | 'sleep'
  | 'morning'
  | 'warning'
  | 'hazard'
  | 'breakdown'
  | 'alien'
  | 'win'
  | 'lose';

export interface SoundEntry {
  file: string;
  /** 0..1, multiplied with the master volume. */
  volume: number;
  /**
   * When several sounds are triggered by the same click, only the highest priority plays
   * (e.g. "upgrade" wins over the generic button "click").
   */
  priority: number;
  /** What it's for (for whoever replaces the file). */
  use: string;
}

export const SOUNDS: Record<SoundId, SoundEntry> = {
  click: { file: 'sounds/click.wav', volume: 0.5, priority: 0, use: 'Any button or character click' },
  open: { file: 'sounds/open.wav', volume: 0.6, priority: 1, use: 'A pop-up opens (building, Report, talk)' },
  close: { file: 'sounds/close.wav', volume: 0.5, priority: 1, use: 'A pop-up closes' },
  denied: { file: 'sounds/denied.wav', volume: 0.7, priority: 2, use: "Can't do that (not enough AP, locked)" },
  upgrade: { file: 'sounds/upgrade.wav', volume: 0.7, priority: 2, use: 'An upgrade or task is done' },
  fixed: { file: 'sounds/fixed.wav', volume: 0.8, priority: 3, use: 'A broken building works again' },
  sleep: { file: 'sounds/sleep.wav', volume: 0.7, priority: 2, use: 'End the Day' },
  morning: { file: 'sounds/morning.wav', volume: 0.7, priority: 2, use: 'A new day starts' },
  warning: { file: 'sounds/warning.wav', volume: 0.6, priority: 3, use: 'A hazard is coming' },
  hazard: { file: 'sounds/hazard.wav', volume: 0.9, priority: 4, use: 'A hazard hits the outpost' },
  breakdown: { file: 'sounds/breakdown.wav', volume: 0.8, priority: 3, use: 'A building breaks or loses power' },
  alien: { file: 'sounds/alien.wav', volume: 0.9, priority: 4, use: 'The alien boss arrives' },
  win: { file: 'music/win.wav', volume: 0.8, priority: 4, use: 'Good ending' },
  lose: { file: 'music/lose.wav', volume: 0.8, priority: 4, use: 'Bad ending / game over' },
};

/** Overall loudness, so the game never blasts out of a classroom speaker. */
export const MASTER_VOLUME = 0.7;
