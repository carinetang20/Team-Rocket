// Browser storage for saves and the player profile. Every access is wrapped in try/catch:
// storage can be blocked (private windows, school computers), and the game must still work.

import type { Strategy } from '../contract/types';

const SAVE_KEY = 'mars-outpost.save.v1';
const PROFILE_KEY = 'mars-outpost.profile.v1';

/** Data kept across runs (decision D4: endings collection). */
export interface Profile {
  endingsUnlocked: Strategy[];
  tutorialSeen: boolean;
}

const DEFAULT_PROFILE: Profile = { endingsUnlocked: [], tutorialSeen: false };

export function saveGame(text: string): void {
  try {
    localStorage.setItem(SAVE_KEY, text);
  } catch {
    /* storage unavailable — game continues without saving */
  }
}

export function loadGame(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      endingsUnlocked: Array.isArray(parsed.endingsUnlocked) ? parsed.endingsUnlocked : [],
      tutorialSeen: parsed.tutorialSeen === true,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}
