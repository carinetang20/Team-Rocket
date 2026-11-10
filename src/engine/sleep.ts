import { CONFIG } from '../config/gameConfig';
import type {
  EngineEvent,
  FacilityId,
  GameState,
  HazardDamage,
  ResourceChange,
  ResourceId,
  StepResult,
} from '../contract/types';
import { FACILITY_IDS, LIFE_SUPPORT_IDS } from '../contract/types';
import {
  changeResource,
  cloneState,
  entries,
  facilityName,
  poweredStatus,
  setFacilityStatus,
} from './resources';

interface HazardDef {
  id: string;
  name: string;
  description: string;
  damage: Partial<Record<ResourceId, number>>;
}

function blockersFor(
  state: GameState,
  hazard: HazardDef,
  resource: ResourceId,
): HazardDamage['blockedBy'] {
  const out: HazardDamage['blockedBy'] = [];
  const reinforce = CONFIG.tasks.reinforceHabitat;
  const shelter = CONFIG.tasks.buildRadiationShelter;

  if (resource === 'shield' && (state.upgrades[reinforce.id] ?? 0) > 0) {
    out.push({
      taskId: reinforce.id,
      name: reinforce.name,
      amount: reinforce.shieldBlockAmount,
    });
  }
  if (
    hazard.id === 'solarFlare' &&
    resource === 'power' &&
    (state.upgrades[shelter.id] ?? 0) > 0
  ) {
    out.push({
      taskId: shelter.id,
      name: shelter.name,
      amount: shelter.radiationBlockAmount,
    });
  }
  return out;
}

/** Night resolution (contract §4). Does not advance the day. */
export function resolveSleep(state: GameState): StepResult {
  if (state.phase !== 'playing' || state.day >= CONFIG.finalDay) {
    return { state, events: [] };
  }

  const s = cloneState(state);
  const events: EngineEvent[] = [];
  const statusEvents: EngineEvent[] = [];
  let hazardHit: HazardDef | null = null;

  // 1. Hazard (D2)
  if (s.upcoming?.kind === 'hazard' && s.upcoming.day === s.day) {
    const hz = CONFIG.hazards.find((h) => h.id === s.upcoming?.hazardId);
    if (hz) {
      const damage: HazardDamage[] = [];
      for (const [resource, base] of entries(hz.damage)) {
        const blockedBy = blockersFor(s, hz, resource);
        const blocked = blockedBy.reduce((sum, b) => sum + b.amount, 0);
        const final = Math.max(0, base - blocked);
        changeResource(s, resource, -final, hz.name);
        s.stats.damageBlocked += Math.min(base, blocked);
        damage.push({ resource, base, final, blockedBy });
      }
      events.push({
        type: 'hazardStruck',
        hazardId: hz.id,
        name: hz.name,
        description: hz.description,
        damage,
      });
      hazardHit = hz;
    }
    s.upcoming = null;
  }

  // 2. Consumption
  const used: ResourceChange[] = LIFE_SUPPORT_IDS.map((r) =>
    changeResource(s, r, -CONFIG.dailyConsumption[r], 'The crew used it'),
  );

  // 3. Power: produce, then allocate by priority
  const ps = s.facilities.powerStation;
  const made = ps.status === 'damaged' ? 0 : (ps.producesPerDay.power ?? 0);
  const available = s.resources.power.current + made;
  let powerUsed = 0;
  const off: FacilityId[] = [];

  for (const id of CONFIG.powerPriority) {
    const f = s.facilities[id];
    if (f.status === 'damaged') continue;
    if (available - powerUsed >= f.powerUse) {
      powerUsed += f.powerUse;
      setFacilityStatus(s, id, poweredStatus(s, id), 'Power is back on', statusEvents);
    } else {
      off.push(id);
      setFacilityStatus(s, id, 'unpowered', 'Not enough power', statusEvents);
    }
  }

  s.resources.power.current = Math.min(s.resources.power.max, available - powerUsed);
  events.push({
    type: 'consumption',
    changes: [
      ...used,
      { resource: 'power', delta: -powerUsed, field: 'current', reason: 'Machines used power' },
    ],
  });
  if (off.length) {
    const shortfall = off.reduce((sum, id) => sum + s.facilities[id].powerUse, 0);
    events.push({ type: 'powerShortage', shortfall, facilitiesOff: off });
  }
  events.push(...statusEvents);

  // 4. Production (non-power facilities)
  const produced: ResourceChange[] = [
    { resource: 'power', delta: made, field: 'current', reason: 'Solar panels' },
  ];
  for (const id of FACILITY_IDS) {
    if (id === 'powerStation') continue;
    const f = s.facilities[id];
    if (f.status !== 'operational' && f.status !== 'growing') continue;
    for (const [resource, amount] of entries(f.producesPerDay)) {
      produced.push(changeResource(s, resource, amount, facilityName(id)));
    }
  }
  events.push({ type: 'production', changes: produced });

  // 5. Crops ready overnight
  const ready = s.crops.filter((c) => c.readyOnDay <= s.day + 1);
  if (ready.length) {
    const amount = ready.reduce((sum, c) => sum + c.amount, 0);
    changeResource(s, 'food', amount, 'Harvest');
    s.crops = s.crops.filter((c) => c.readyOnDay > s.day + 1);
    events.push({ type: 'cropsReady', amount });
    if (s.crops.length === 0 && s.facilities.greenhouse.status === 'growing') {
      setFacilityStatus(s, 'greenhouse', 'operational', 'Crops harvested', events);
    }
  }

  // 6. Health check
  const low = LIFE_SUPPORT_IDS.filter(
    (r) => s.resources[r].current < CONFIG.lifeSupportThreshold,
  );
  for (const r of LIFE_SUPPORT_IDS) {
    s.lowStreaks[r] = low.includes(r) ? s.lowStreaks[r] + 1 : 0;
  }
  const delta =
    low.length === 0
      ? CONFIG.healthDelta.allHealthy
      : low.length === 1
        ? CONFIG.healthDelta.oneLow
        : CONFIG.healthDelta.manyLow;
  const reason = low.length === 0 ? 'allHealthy' : low.length === 1 ? 'oneLow' : 'manyLow';
  const hc = changeResource(s, 'health', delta, 'Health check');
  events.push({ type: 'healthChanged', delta: hc.delta, reason, lowResources: low });

  // 7. Death (D3)
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
}
