import type {
  EngineEvent,
  FacilityId,
  FacilityStatus,
  GameState,
  ResourceChange,
  ResourceId,
} from '../contract/types';
import { CONFIG } from '../config/gameConfig';

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function changeResource(
  state: GameState,
  resource: ResourceId,
  delta: number,
  reason: string,
): ResourceChange {
  const r = state.resources[resource];
  const before = r.current;
  r.current = Math.max(0, Math.min(r.max, r.current + delta));
  return { resource, delta: r.current - before, field: 'current', reason };
}

export function raiseMax(
  state: GameState,
  resource: ResourceId,
  amount: number,
  reason: string,
): ResourceChange {
  state.resources[resource].max += amount;
  return { resource, delta: amount, field: 'max', reason };
}

export function setFacilityStatus(
  state: GameState,
  id: FacilityId,
  to: FacilityStatus,
  reason: string,
  out: EngineEvent[],
): void {
  const f = state.facilities[id];
  if (f.status === to) return;
  out.push({ type: 'facilityStatusChanged', facility: id, from: f.status, to, reason });
  f.status = to;
}

export function poweredStatus(state: GameState, id: FacilityId): FacilityStatus {
  return id === 'greenhouse' && state.crops.length > 0 ? 'growing' : 'operational';
}

export function entries<K extends string>(obj: Partial<Record<K, number>>): [K, number][] {
  return Object.entries(obj) as [K, number][];
}

export function facilityName(id: FacilityId): string {
  return CONFIG.facilityNames[id];
}
