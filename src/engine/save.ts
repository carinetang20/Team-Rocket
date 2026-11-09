import type { GameState } from "./types.js";

const SAVE_VERSION = 1 as const;

export interface SaveBlob {
  version: typeof SAVE_VERSION;
  savedAt: string;
  state: GameState;
}

export function serializeState(state: GameState): string {
  const blob: SaveBlob = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: structuredClone(state),
  };
  return JSON.stringify(blob);
}

export function deserializeState(raw: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Save data is not valid JSON.");
  }

  if (!isSaveBlob(parsed)) {
    throw new Error("Save data is missing required fields.");
  }
  if (parsed.version !== SAVE_VERSION) {
    throw new Error(`Unsupported save version: ${parsed.version}`);
  }
  if (parsed.state.version !== 1) {
    throw new Error(`Unsupported game state version: ${parsed.state.version}`);
  }

  return structuredClone(parsed.state);
}

function isSaveBlob(value: unknown): value is SaveBlob {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === SAVE_VERSION &&
    typeof v.savedAt === "string" &&
    typeof v.state === "object" &&
    v.state !== null &&
    (v.state as GameState).version === 1
  );
}
