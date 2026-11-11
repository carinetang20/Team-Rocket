// ⚠ FAKE ENGINE — TEMPORARY, owned by Person B.
//
// A rough stand-in so screens can be built and clicked through before Person A's real
// engine (src/engine/) exists. It follows the contract (src/contract/) so the real engine
// can replace it by changing ONE line in src/main.ts.
//
// The numbers here are quick guesses from the design doc. Do NOT balance the game here,
// and do NOT copy this into the real engine — it ignores the open design issues on purpose.
// Delete this folder once the real engine is ready.

import type { EngineRules, GameEngine } from '../contract/engine';
import { STRATEGY_STAT } from '../contract/engine';
import type {
  EngineEvent,
  FacilityId,
  FacilityState,
  FacilityStatus,
  GameState,
  HazardDamage,
  ResourceChange,
  ResourceId,
  StepResult,
  Strategy,
  TaskCategory,
  TaskId,
  TaskView,
} from '../contract/types';
import { FACILITY_IDS, LIFE_SUPPORT_IDS } from '../contract/types';

const SAVE_VERSION = 1;

const FAKE = {
  apPerDay: 3,
  apCap: 6,
  dailyUse: 2,
  hazardDays: [3, 6, 9, 12] as readonly number[],
  warningDays: [2, 5, 8, 11] as readonly number[],
  bossWarningDay: 14,
} as const;

const RULES: EngineRules = { finalDay: 15, endingRequired: 50, lifeSupportThreshold: 5 };

const NAMES: Record<FacilityId, string> = {
  mainBase: 'Main Base',
  shieldGenerator: 'Shield Generator',
  powerStation: 'Power Station',
  greenhouse: 'Greenhouse',
  oxygenGenerator: 'Oxygen Generator',
  waterRecycler: 'Water Recycler',
};

/** If power runs short, facilities later in this list switch off first. */
const POWER_PRIORITY: FacilityId[] = ['oxygenGenerator', 'waterRecycler', 'greenhouse', 'shieldGenerator'];

// ---------- Hazards & random events (from design doc tables) ----------

interface FakeHazard {
  id: string;
  name: string;
  description: string;
  damage: Partial<Record<ResourceId, number>>;
}

const HAZARDS: FakeHazard[] = [
  { id: 'oxygenLeak', name: 'Oxygen Leak', description: 'Damaged pipes let oxygen escape!', damage: { oxygen: 5 } },
  { id: 'waterContamination', name: 'Water Contamination', description: 'The Water Recycler got dirty!', damage: { water: 5 } },
  { id: 'solarFlare', name: 'Solar Flare', description: 'A solar storm zapped our electrical systems!', damage: { power: 6 } },
  { id: 'generatorMalfunction', name: 'Generator Malfunction', description: 'The main generator broke down for a while!', damage: { power: 5 } },
  { id: 'dustStorm', name: 'Dust Storm', description: 'A huge Martian dust storm hit the outpost!', damage: { shield: 7 } },
  { id: 'meteorShower', name: 'Meteor Shower', description: 'Meteors crashed into the outpost!', damage: { shield: 6, power: 6 } },
  { id: 'alienInvasion', name: 'Alien Invasion', description: 'A hungry alien demanded our food!', damage: { food: 6 } },
  { id: 'cropInfestation', name: 'Crop Infestation', description: 'Space pests nibbled the greenhouse crops!', damage: { food: 5 } },
];

const RANDOM_EVENTS: {
  id: string;
  name: string;
  message: string;
  positive: boolean;
  changes: Partial<Record<ResourceId, number>>;
}[] = [
  { id: 'undergroundIce', name: 'Underground Ice Discovery', message: 'The team found ice underground and melted it into water!', positive: true, changes: { water: 4 } },
  { id: 'supplyDiscovery', name: 'Supply Discovery', message: 'You found an old supply crate with food inside!', positive: true, changes: { food: 3 } },
  { id: 'alienSigns', name: 'Alien Discovery', message: 'Giant footprints were spotted near the outpost... the alien is still out there.', positive: true, changes: {} },
  { id: 'equipmentMalfunction', name: 'Equipment Malfunction', message: 'A wire came loose and some power was lost.', positive: false, changes: { power: -2 } },
  { id: 'smallOxygenLeak', name: 'Small Oxygen Leak', message: 'A tiny crack let some oxygen out. It is patched now!', positive: false, changes: { oxygen: -2 } },
];

// ---------- Tasks (from design doc task table, fake effects) ----------

interface FakeTask {
  id: TaskId;
  name: string;
  description: string;
  category: TaskCategory;
  facility: FacilityId;
  apCost: number;
  maxLevel: number | null;
  requires?: (s: GameState) => boolean;
  requiresText?: string;
  apply: (s: GameState) => ResourceChange[];
}

const TASKS: FakeTask[] = [
  {
    id: 'repairOxygenGenerator', name: 'Repair Oxygen Generator', category: 'lifeSupport', facility: 'oxygenGenerator',
    description: 'Fix the broken pipes so it makes new oxygen every night.', apCost: 2, maxLevel: 1,
    apply: (s) => { repair(s, 'oxygenGenerator'); return []; },
  },
  {
    id: 'repairWaterRecycler', name: 'Repair Water Recycler', category: 'lifeSupport', facility: 'waterRecycler',
    description: 'Fix the filters so it cleans water every night.', apCost: 1, maxLevel: 1,
    apply: (s) => { repair(s, 'waterRecycler'); return []; },
  },
  {
    id: 'installSolarPanels', name: 'Install Solar Panels', category: 'power', facility: 'powerStation',
    description: 'More panels = more power made every day.', apCost: 2, maxLevel: 3,
    apply: (s) => { addProduction(s, 'powerStation', 'power', 2); return []; },
  },
  {
    id: 'upgradeBatteries', name: 'Upgrade Batteries', category: 'power', facility: 'powerStation',
    description: 'Bigger batteries can store more power.', apCost: 2, maxLevel: 3,
    apply: (s) => raiseMax(s, 'power', 10, 'Upgrade Batteries'),
  },
  {
    id: 'reinforceHabitat', name: 'Reinforce Habitat', category: 'shielding', facility: 'mainBase',
    description: 'Stronger walls mean hazards damage the shield less.', apCost: 2, maxLevel: 1,
    apply: () => [],
  },
  {
    id: 'buildRadiationShelter', name: 'Build Radiation Shelter', category: 'shielding', facility: 'mainBase',
    description: 'A safe room that protects us from solar radiation.', apCost: 2, maxLevel: 1,
    apply: () => [],
  },
  {
    id: 'plantCrops', name: 'Plant Crops', category: 'food', facility: 'greenhouse',
    description: 'Plant seeds now — they will be ready to eat in 2 days.', apCost: 1, maxLevel: null,
    requires: (s) => s.facilities.greenhouse.status !== 'damaged', requiresText: 'The Greenhouse must be working first.',
    apply: (s) => {
      s.crops.push({ readyOnDay: s.day + 2, amount: 6 });
      if (s.facilities.greenhouse.status === 'operational') s.facilities.greenhouse.status = 'growing';
      return [];
    },
  },
  {
    id: 'expandGreenhouse', name: 'Expand Greenhouse', category: 'food', facility: 'greenhouse',
    description: 'More room to store food and grow more each day.', apCost: 2, maxLevel: 2,
    requires: (s) => s.facilities.greenhouse.status !== 'damaged', requiresText: 'The Greenhouse must be working first.',
    apply: (s) => { addProduction(s, 'greenhouse', 'food', 2); return raiseMax(s, 'food', 10, 'Expand Greenhouse'); },
  },
];

// ---------- Helpers ----------

function clone(s: GameState): GameState {
  return structuredClone(s);
}

/** Seeded random number in [0, 1) (mulberry32). Advances s.rngState. */
function rand(s: GameState): number {
  s.rngState = (s.rngState + 0x6d2b79f5) >>> 0;
  let t = s.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function entries<K extends string>(obj: Partial<Record<K, number>>): [K, number][] {
  return Object.entries(obj) as [K, number][];
}

function change(s: GameState, resource: ResourceId, delta: number, reason: string): ResourceChange {
  const r = s.resources[resource];
  const before = r.current;
  r.current = Math.max(0, Math.min(r.max, r.current + delta));
  return { resource, delta: r.current - before, field: 'current', reason };
}

function raiseMax(s: GameState, resource: ResourceId, amount: number, reason: string): ResourceChange[] {
  s.resources[resource].max += amount;
  return [{ resource, delta: amount, field: 'max', reason }];
}

function repair(s: GameState, id: FacilityId): void {
  s.facilities[id].status = 'operational';
}

function addProduction(s: GameState, id: FacilityId, resource: ResourceId, amount: number): void {
  const f = s.facilities[id];
  f.producesPerDay[resource] = (f.producesPerDay[resource] ?? 0) + amount;
  f.level += 1;
}

function facility(id: FacilityId, status: FacilityStatus, producesPerDay: FacilityState['producesPerDay'], powerUse: number): FacilityState {
  return { id, status, level: 1, producesPerDay, powerUse };
}

function poweredStatus(s: GameState, id: FacilityId): FacilityStatus {
  return id === 'greenhouse' && s.crops.length > 0 ? 'growing' : 'operational';
}

function setStatus(s: GameState, id: FacilityId, to: FacilityStatus, reason: string, out: EngineEvent[]): void {
  const f = s.facilities[id];
  if (f.status === to) return;
  out.push({ type: 'facilityStatusChanged', facility: id, from: f.status, to, reason });
  f.status = to;
}

function toView(s: GameState, t: FakeTask): TaskView {
  const level = s.upgrades[t.id] ?? 0;
  let lockedReason: string | undefined;
  if (s.phase !== 'playing') lockedReason = 'The game is over.';
  else if (t.maxLevel !== null && level >= t.maxLevel) lockedReason = 'Already fully upgraded!';
  else if (t.requires && !t.requires(s)) lockedReason = t.requiresText ?? 'Not possible yet.';
  else if (s.ap < t.apCost) lockedReason = `Not enough AP — you need ${t.apCost} but have ${s.ap}.`;
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    facility: t.facility,
    apCost: t.apCost,
    level,
    maxLevel: t.maxLevel,
    available: lockedReason === undefined,
    lockedReason,
    effects: [],
  };
}

function blockersFor(s: GameState, hazard: FakeHazard, resource: ResourceId): HazardDamage['blockedBy'] {
  const out: HazardDamage['blockedBy'] = [];
  if (resource === 'shield' && (s.upgrades['reinforceHabitat'] ?? 0) > 0) {
    out.push({ taskId: 'reinforceHabitat', name: 'Reinforced Habitat', amount: 3 });
  }
  if (hazard.id === 'solarFlare' && resource === 'power' && (s.upgrades['buildRadiationShelter'] ?? 0) > 0) {
    out.push({ taskId: 'buildRadiationShelter', name: 'Radiation Shelter', amount: 3 });
  }
  return out;
}

// ---------- Engine ----------

export function createFakeEngine(): GameEngine {
  return {
    rules: RULES,

    newGame(options = {}): StepResult {
      const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
      const res = (current: number, max: number) => ({ current, max });
      const state: GameState = {
        version: SAVE_VERSION,
        seed,
        rngState: seed,
        day: 1,
        phase: 'playing',
        ap: FAKE.apPerDay,
        apCap: FAKE.apCap,
        resources: {
          food: res(10, 50),
          power: res(10, 50),
          shield: res(10, 50),
          health: res(10, 50),
          oxygen: res(10, 30),
          water: res(10, 30),
        },
        facilities: {
          mainBase: facility('mainBase', 'operational', {}, 0),
          shieldGenerator: facility('shieldGenerator', 'operational', {}, 1),
          powerStation: facility('powerStation', 'operational', { power: 3 }, 0),
          greenhouse: facility('greenhouse', 'operational', { food: 3 }, 1),
          oxygenGenerator: facility('oxygenGenerator', 'damaged', { oxygen: 3 }, 1),
          waterRecycler: facility('waterRecycler', 'damaged', { water: 3 }, 1),
        },
        upgrades: {},
        crops: [],
        upcoming: null,
        lowStreaks: { food: 0, water: 0, oxygen: 0 },
        stats: { daysSurvived: 0, tasksCompleted: 0, apSpent: 0, hazardsSurvived: 0, damageBlocked: 0 },
        deathCause: null,
        outcome: null,
      };
      return {
        state,
        events: [{ type: 'dayStarted', day: 1, apGranted: FAKE.apPerDay, apTotal: state.ap, apLostToCap: 0 }],
      };
    },

    getTasks(state) {
      return TASKS.map((t) => toView(state, t));
    },

    doTask(state, taskId) {
      const task = TASKS.find((t) => t.id === taskId);
      if (!task) return { state, events: [{ type: 'taskRejected', taskId, reason: 'Unknown task.' }] };
      const view = toView(state, task);
      if (!view.available) {
        return { state, events: [{ type: 'taskRejected', taskId, reason: view.lockedReason ?? 'Not possible right now.' }] };
      }
      const s = clone(state);
      s.ap -= task.apCost;
      s.upgrades[task.id] = (s.upgrades[task.id] ?? 0) + 1;
      const changes = task.apply(s);
      s.stats.tasksCompleted += 1;
      s.stats.apSpent += task.apCost;
      return {
        state: s,
        events: [{ type: 'taskCompleted', taskId, name: task.name, apSpent: task.apCost, newLevel: s.upgrades[task.id] ?? 1, changes }],
      };
    },

    sleep(state) {
      if (state.phase !== 'playing' || state.day >= RULES.finalDay) return { state, events: [] };
      const s = clone(state);
      const events: EngineEvent[] = [];
      const statusEvents: EngineEvent[] = [];
      let hazardHit: FakeHazard | null = null;

      // 1. Hazard (decision D2)
      if (s.upcoming?.kind === 'hazard' && s.upcoming.day === s.day) {
        const hz = HAZARDS.find((h) => h.id === s.upcoming?.hazardId);
        if (hz) {
          const damage: HazardDamage[] = [];
          for (const [resource, base] of entries(hz.damage)) {
            const blockedBy = blockersFor(s, hz, resource);
            const blocked = blockedBy.reduce((sum, b) => sum + b.amount, 0);
            const final = Math.max(0, base - blocked);
            change(s, resource, -final, hz.name);
            s.stats.damageBlocked += Math.min(base, blocked);
            damage.push({ resource, base, final, blockedBy });
          }
          events.push({ type: 'hazardStruck', hazardId: hz.id, name: hz.name, description: hz.description, damage });
          hazardHit = hz;
        }
        s.upcoming = null;
      }

      // 2. Consumption
      const used = LIFE_SUPPORT_IDS.map((r) => change(s, r, -FAKE.dailyUse, 'The crew used it'));

      // 3. Power: make, then share out by priority
      const ps = s.facilities.powerStation;
      const made = ps.status === 'damaged' ? 0 : (ps.producesPerDay.power ?? 0);
      const available = s.resources.power.current + made;
      let powerUsed = 0;
      const off: FacilityId[] = [];
      for (const id of POWER_PRIORITY) {
        const f = s.facilities[id];
        if (f.status === 'damaged') continue;
        if (available - powerUsed >= f.powerUse) {
          powerUsed += f.powerUse;
          setStatus(s, id, poweredStatus(s, id), 'Power is back on', statusEvents);
        } else {
          off.push(id);
          setStatus(s, id, 'unpowered', 'Not enough power', statusEvents);
        }
      }
      s.resources.power.current = Math.min(s.resources.power.max, available - powerUsed);
      events.push({
        type: 'consumption',
        changes: [...used, { resource: 'power', delta: -powerUsed, field: 'current', reason: 'Machines used power' }],
      });
      if (off.length) {
        const shortfall = off.reduce((sum, id) => sum + s.facilities[id].powerUse, 0);
        events.push({ type: 'powerShortage', shortfall, facilitiesOff: off });
      }
      events.push(...statusEvents);

      // 4. Production
      const produced: ResourceChange[] = [{ resource: 'power', delta: made, field: 'current', reason: 'Solar panels' }];
      for (const id of FACILITY_IDS) {
        if (id === 'powerStation') continue;
        const f = s.facilities[id];
        if (f.status !== 'operational' && f.status !== 'growing') continue;
        for (const [resource, amount] of entries(f.producesPerDay)) produced.push(change(s, resource, amount, NAMES[id]));
      }
      events.push({ type: 'production', changes: produced });

      // 5. Crops
      const ready = s.crops.filter((c) => c.readyOnDay <= s.day + 1);
      if (ready.length) {
        const amount = ready.reduce((sum, c) => sum + c.amount, 0);
        change(s, 'food', amount, 'Harvest');
        s.crops = s.crops.filter((c) => c.readyOnDay > s.day + 1);
        events.push({ type: 'cropsReady', amount });
        if (s.crops.length === 0 && s.facilities.greenhouse.status === 'growing') {
          setStatus(s, 'greenhouse', 'operational', 'Crops harvested', events);
        }
      }

      // 6. Health
      const low = LIFE_SUPPORT_IDS.filter((r) => s.resources[r].current < RULES.lifeSupportThreshold);
      for (const r of LIFE_SUPPORT_IDS) s.lowStreaks[r] = low.includes(r) ? s.lowStreaks[r] + 1 : 0;
      const delta = low.length === 0 ? 2 : low.length === 1 ? -2 : -3;
      const reason = low.length === 0 ? 'allHealthy' : low.length === 1 ? 'oneLow' : 'manyLow';
      const hc = change(s, 'health', delta, 'Health check');
      events.push({ type: 'healthChanged', delta: hc.delta, reason, lowResources: low });

      // 7. Death check (decision D3)
      if (s.resources.health.current <= 0) {
        const lowResources = LIFE_SUPPORT_IDS.filter((r) => s.lowStreaks[r] > 0).map((r) => ({
          resource: r,
          nightsBelow: s.lowStreaks[r],
        }));
        s.phase = 'dead';
        s.deathCause = {
          lowResources,
          finalBlow: lowResources.length ? 'lowResources' : 'hazard',
          hazardId: hazardHit?.id,
          hazardName: hazardHit?.name,
        };
        s.stats.daysSurvived = s.day - 1;
        s.outcome = { result: 'dead' };
        events.push({ type: 'gameOver', cause: s.deathCause });
      } else {
        if (hazardHit) s.stats.hazardsSurvived += 1;
        s.stats.daysSurvived = s.day;
        events.push({ type: 'nightEnded', day: s.day });
      }
      return { state: s, events };
    },

    startDay(state) {
      if (state.phase !== 'playing' || state.day >= RULES.finalDay) return { state, events: [] };
      const s = clone(state);
      const events: EngineEvent[] = [];
      s.day += 1;

      // Final day: the boss arrives at the start of the day — no AP, no tasks (decision D1).
      if (s.day >= RULES.finalDay) {
        s.upcoming = null;
        events.push({ type: 'bossArrived', day: s.day });
        return { state: s, events };
      }

      const total = s.ap + FAKE.apPerDay;
      s.ap = Math.min(total, s.apCap);
      events.push({ type: 'dayStarted', day: s.day, apGranted: FAKE.apPerDay, apTotal: s.ap, apLostToCap: total - s.ap });

      // Random event (50%); only good news on hazard days
      if (rand(s) < 0.5) {
        const hazardDay = FAKE.hazardDays.includes(s.day);
        const pool = RANDOM_EVENTS.filter((e) => !hazardDay || e.positive);
        const ev = pool[Math.floor(rand(s) * pool.length)];
        if (ev) {
          const changes = entries(ev.changes).map(([r, d]) => change(s, r, d, ev.name));
          events.push({ type: 'randomEvent', eventId: ev.id, name: ev.name, message: ev.message, positive: ev.positive, changes });
        }
      }

      // Warnings
      if (FAKE.warningDays.includes(s.day)) {
        const hz = HAZARDS[Math.floor(rand(s) * HAZARDS.length)];
        if (hz) {
          s.upcoming = { day: s.day + 1, kind: 'hazard', hazardId: hz.id, hazardName: hz.name };
          events.push({ type: 'warning', kind: 'hazard', day: s.day + 1, hazardId: hz.id, hazardName: hz.name });
        }
      } else if (s.day === FAKE.bossWarningDay) {
        s.upcoming = { day: RULES.finalDay, kind: 'boss' };
        events.push({ type: 'warning', kind: 'boss', day: RULES.finalDay });
      }

      for (const r of LIFE_SUPPORT_IDS) {
        if (s.lowStreaks[r] >= 2) events.push({ type: 'lowResourceWarning', resource: r, nightsBelow: s.lowStreaks[r] });
      }
      return { state: s, events };
    },

    chooseStrategy(state, strategy: Strategy) {
      if (state.phase !== 'playing' || state.day < RULES.finalDay) return { state, events: [] };
      const s = clone(state);
      const actual = s.resources[STRATEGY_STAT[strategy]].current;
      const required = RULES.endingRequired;
      const success = actual >= required;
      s.phase = success ? 'won' : 'lost';
      s.outcome = { result: success ? 'win' : 'bad', strategy, required, actual };
      s.stats.daysSurvived = RULES.finalDay;
      return { state: s, events: [{ type: 'bossResolved', strategy, required, actual, success }] };
    },

    serialize(state) {
      return JSON.stringify(state);
    },

    deserialize(text) {
      const parsed = JSON.parse(text) as GameState;
      if (parsed?.version !== SAVE_VERSION) throw new Error('Save is from a different version.');
      return parsed;
    },
  };
}
