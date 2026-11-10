import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config/gameConfig';
import { createEngine } from '../src/engine';
import type { GameState, Strategy } from '../src/contract/types';

/** Keep life support high enough to survive nights while testing other systems. */
function stabilize(state: GameState): GameState {
  state.resources.food.current = Math.max(state.resources.food.current, 20);
  state.resources.water.current = Math.max(state.resources.water.current, 20);
  state.resources.oxygen.current = Math.max(state.resources.oxygen.current, 20);
  state.resources.health.current = Math.max(state.resources.health.current, 20);
  state.facilities.oxygenGenerator.status = 'operational';
  state.facilities.waterRecycler.status = 'operational';
  return state;
}

function advanceToDay(engine: ReturnType<typeof createEngine>, state: GameState, day: number): GameState {
  let s = state;
  while (s.day < day && s.phase === 'playing') {
    stabilize(s);
    ({ state: s } = engine.sleep(s));
    if (s.phase !== 'playing') break;
    ({ state: s } = engine.startDay(s));
  }
  return s;
}

describe('config & newGame', () => {
  it('starts on day 1 with AP and damaged life-support (O3)', () => {
    const engine = createEngine();
    const { state, events } = engine.newGame({ seed: 42 });
    expect(state.day).toBe(1);
    expect(state.ap).toBe(CONFIG.apPerDay);
    expect(state.apCap).toBe(CONFIG.apCap);
    expect(state.facilities.oxygenGenerator.status).toBe('damaged');
    expect(state.facilities.waterRecycler.status).toBe('damaged');
    expect(state.facilities.shieldGenerator.producesPerDay.shield).toBeGreaterThan(0);
    expect(events[0]?.type).toBe('dayStarted');
  });

  it('exposes rules from config (no hard-coded UI numbers)', () => {
    const engine = createEngine();
    expect(engine.rules.finalDay).toBe(CONFIG.finalDay);
    expect(engine.rules.endingRequired).toBe(CONFIG.endingRequired);
    expect(engine.rules.lifeSupportThreshold).toBe(CONFIG.lifeSupportThreshold);
  });
});

describe('AP & tasks', () => {
  it('rejects tasks that cost more AP than available', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 7 });
    state = { ...state, ap: 1 };
    const result = engine.doTask(state, 'repairOxygenGenerator');
    expect(result.events[0]?.type).toBe('taskRejected');
    expect(result.state.ap).toBe(1);
  });

  it('repairs oxygen generator immediately', () => {
    const engine = createEngine();
    const { state } = engine.newGame({ seed: 9 });
    const result = engine.doTask(state, 'repairOxygenGenerator');
    expect(result.events[0]?.type).toBe('taskCompleted');
    expect(result.state.facilities.oxygenGenerator.status).toBe('operational');
    expect(result.state.ap).toBe(CONFIG.apPerDay - 2);
  });

  it('enforces maxLevel (O5)', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 8 });
    state = { ...state, ap: 10 };
    ({ state } = engine.doTask(state, 'repairOxygenGenerator'));
    state = { ...state, ap: 10 };
    const second = engine.doTask(state, 'repairOxygenGenerator');
    expect(second.events[0]?.type).toBe('taskRejected');
  });

  it('chargeShield raises shield (O1)', () => {
    const engine = createEngine();
    const { state } = engine.newGame({ seed: 11 });
    const before = state.resources.shield.current;
    const result = engine.doTask(state, 'chargeShield');
    expect(result.state.resources.shield.current).toBeGreaterThan(before);
    expect(result.state.resources.power.current).toBeLessThan(state.resources.power.current);
  });

  it('visitMedBay raises health (O2)', () => {
    const engine = createEngine();
    const { state } = engine.newGame({ seed: 13 });
    const before = state.resources.health.current;
    const result = engine.doTask(state, 'visitMedBay');
    expect(result.state.resources.health.current).toBeGreaterThan(before);
  });

  it('plantCrops schedules a harvest batch', () => {
    const engine = createEngine();
    const { state } = engine.newGame({ seed: 15 });
    const result = engine.doTask(state, 'plantCrops');
    expect(result.state.crops.length).toBe(1);
    expect(result.state.crops[0]?.readyOnDay).toBe(state.day + CONFIG.tasks.plantCrops.cropReadyInDays);
    expect(result.state.facilities.greenhouse.status).toBe('growing');
  });
});

describe('sleep: hazards, power, health', () => {
  it('warns on day 2 and strikes hazard on day 3 sleep (D2)', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 55 });
    ({ state } = engine.sleep(state));
    ({ state } = engine.startDay(state));
    expect(state.day).toBe(2);
    expect(state.upcoming?.kind).toBe('hazard');
    expect(state.upcoming?.day).toBe(3);

    ({ state } = engine.sleep(state));
    ({ state } = engine.startDay(state));
    expect(state.day).toBe(3);

    const night = engine.sleep(state);
    expect(night.events.some((e) => e.type === 'hazardStruck')).toBe(true);
  });

  it('reinforceHabitat blocks shield hazard damage (D2)', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 21 });
    state = { ...state, ap: 10 };
    ({ state } = engine.doTask(state, 'reinforceHabitat'));
    state.upcoming = {
      day: state.day,
      kind: 'hazard',
      hazardId: 'dustStorm',
      hazardName: 'Dust Storm',
    };
    const before = state.resources.shield.current;
    const night = engine.sleep(state);
    const struck = night.events.find((e) => e.type === 'hazardStruck');
    expect(struck?.type).toBe('hazardStruck');
    if (struck?.type === 'hazardStruck') {
      const shieldHit = struck.damage.find((d) => d.resource === 'shield');
      expect(shieldHit?.blockedBy.some((b) => b.taskId === 'reinforceHabitat')).toBe(true);
      expect(shieldHit!.final).toBeLessThan(shieldHit!.base);
    }
    expect(night.state.resources.shield.current).toBeGreaterThan(
      before - 7, // full dust storm without block
    );
  });

  it('shuts shield off before oxygen when power is short (O4)', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 33 });
    state.facilities.oxygenGenerator.status = 'operational';
    state.facilities.waterRecycler.status = 'operational';
    state.facilities.greenhouse.status = 'operational';
    state.facilities.shieldGenerator.status = 'operational';
    state.facilities.powerStation.producesPerDay.power = 0;
    state.resources.power.current = 1; // only enough for oxygen (1)
    const night = engine.sleep(state);
    expect(night.state.facilities.oxygenGenerator.status).not.toBe('unpowered');
    expect(night.state.facilities.shieldGenerator.status).toBe('unpowered');
    expect(night.events.some((e) => e.type === 'powerShortage')).toBe(true);
  });

  it('records death cause when health hits 0 (D3)', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 44 });
    state.resources.health.current = 1;
    state.resources.food.current = 0;
    state.resources.water.current = 0;
    state.resources.oxygen.current = 0;
    state.lowStreaks = { food: 2, water: 2, oxygen: 2 };
    const night = engine.sleep(state);
    expect(night.state.phase).toBe('dead');
    expect(night.state.deathCause).not.toBeNull();
    expect(night.events.some((e) => e.type === 'gameOver')).toBe(true);
  });

  it('emits lowResourceWarning after 2+ nights below threshold', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 66 });
    state.lowStreaks.oxygen = 2;
    state.resources.oxygen.current = 2;
    stabilize(state);
    state.resources.oxygen.current = 2;
    ({ state } = engine.sleep(state));
    if (state.phase !== 'playing') return;
    const morning = engine.startDay(state);
    expect(morning.events.some((e) => e.type === 'lowResourceWarning' && e.resource === 'oxygen')).toBe(
      true,
    );
  });
});

describe('boss day & endings', () => {
  it('emits bossArrived on day 15 with no AP grant (D1)', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 99 });
    state = advanceToDay(engine, state, 14);
    expect(state.day).toBe(14);
    stabilize(state);
    ({ state } = engine.sleep(state));
    const day15 = engine.startDay(state);
    expect(day15.state.day).toBe(15);
    expect(day15.events.some((e) => e.type === 'bossArrived')).toBe(true);
    expect(day15.state.ap).toBe(state.ap);
  });

  it.each([
    ['shield', 'shield'],
    ['food', 'food'],
    ['power', 'power'],
    ['evacuate', 'health'],
  ] as const)('wins %s strategy when required stat is met', (strategy, resource) => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 1 });
    state = {
      ...state,
      day: 15,
      resources: {
        ...state.resources,
        [resource]: { current: CONFIG.endingRequired, max: 60 },
      },
    };
    const result = engine.chooseStrategy(state, strategy as Strategy);
    expect(result.state.phase).toBe('won');
    expect(result.state.outcome?.result).toBe('win');
    expect(result.events[0]).toMatchObject({ type: 'bossResolved', success: true, strategy });
  });

  it('loses when chosen strategy stat is below threshold', () => {
    const engine = createEngine();
    let { state } = engine.newGame({ seed: 2 });
    state = { ...state, day: 15 };
    const result = engine.chooseStrategy(state, 'shield');
    expect(result.state.phase).toBe('lost');
    expect(result.state.outcome?.result).toBe('bad');
  });
});

describe('save / load', () => {
  it('round-trips serialize / deserialize', () => {
    const engine = createEngine();
    const { state } = engine.newGame({ seed: 123 });
    const mid = engine.doTask(state, 'plantCrops').state;
    const raw = engine.serialize(mid);
    const loaded = engine.deserialize(raw);
    expect(loaded.seed).toBe(123);
    expect(loaded.crops.length).toBe(1);
    expect(loaded.upgrades.plantCrops).toBe(1);
  });

  it('rejects incompatible save versions', () => {
    const engine = createEngine();
    expect(() => engine.deserialize(JSON.stringify({ version: 999 }))).toThrow(/version/i);
  });
});
