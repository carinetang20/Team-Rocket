import type { EngineEvent, EngineEventType, EventOf } from '../contract/types';

export function findEvent<T extends EngineEventType>(events: EngineEvent[], type: T): EventOf<T> | undefined {
  return events.find((e): e is EventOf<T> => e.type === type);
}

export function filterEvents<T extends EngineEventType>(events: EngineEvent[], type: T): EventOf<T>[] {
  return events.filter((e): e is EventOf<T> => e.type === type);
}
