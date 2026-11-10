import { CONFIG } from '../config/gameConfig';
import type { EngineEvent, GameState, StepResult } from '../contract/types';
import { LIFE_SUPPORT_IDS } from '../contract/types';
import { pickIndex, rand } from './rng';
import { changeResource, cloneState, entries } from './resources';

/** Advance to the next day after a survived night (contract §4). */
export function resolveStartDay(state: GameState): StepResult {
  if (state.phase !== 'playing' || state.day >= CONFIG.finalDay) {
    return { state, events: [] };
  }

  const s = cloneState(state);
  const events: EngineEvent[] = [];
  s.day += 1;

  // D1 — Day 15: boss arrives, no AP / tasks / daily report.
  if (s.day >= CONFIG.finalDay) {
    s.upcoming = null;
    events.push({ type: 'bossArrived', day: s.day });
    return { state: s, events };
  }

  const total = s.ap + CONFIG.apPerDay;
  s.ap = Math.min(total, CONFIG.apCap);
  events.push({
    type: 'dayStarted',
    day: s.day,
    apGranted: CONFIG.apPerDay,
    apTotal: s.ap,
    apLostToCap: total - s.ap,
  });

  // Random event (skip harsh ones on hazard mornings)
  if (rand(s) < CONFIG.randomEventChance) {
    const hazardMorning = (CONFIG.hazardDays as readonly number[]).includes(s.day);
    const pool = CONFIG.randomEvents.filter((e) => !hazardMorning || e.positive);
    const ev = pool[pickIndex(s, pool.length)];
    if (ev) {
      const changes = entries(ev.changes).map(([r, d]) => changeResource(s, r, d, ev.name));
      events.push({
        type: 'randomEvent',
        eventId: ev.id,
        name: ev.name,
        message: ev.message,
        positive: ev.positive,
        changes,
      });
    }
  }

  // Warnings (chosen at warning time so players can prepare — contract §7 Q3)
  if ((CONFIG.warningDays as readonly number[]).includes(s.day)) {
    const hz = CONFIG.hazards[pickIndex(s, CONFIG.hazards.length)];
    if (hz) {
      s.upcoming = {
        day: s.day + 1,
        kind: 'hazard',
        hazardId: hz.id,
        hazardName: hz.name,
      };
      events.push({
        type: 'warning',
        kind: 'hazard',
        day: s.day + 1,
        hazardId: hz.id,
        hazardName: hz.name,
      });
    }
  } else if (s.day === CONFIG.bossWarningDay) {
    s.upcoming = { day: CONFIG.finalDay, kind: 'boss' };
    events.push({ type: 'warning', kind: 'boss', day: CONFIG.finalDay });
  }

  for (const r of LIFE_SUPPORT_IDS) {
    if (s.lowStreaks[r] >= 2) {
      events.push({ type: 'lowResourceWarning', resource: r, nightsBelow: s.lowStreaks[r] });
    }
  }

  return { state: s, events };
}
