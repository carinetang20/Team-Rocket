// Person A — all balance numbers live here. Engine code must read from this file.
// Do not hard-code costs, damage, thresholds, or durations elsewhere.

import type { FacilityId, ResourceId } from '../contract/types';

export const CONFIG = {
  saveVersion: 1,
  finalDay: 15,
  endingRequired: 50,
  lifeSupportThreshold: 5,

  apPerDay: 3,
  apCap: 6,

  /** Days that warn about tomorrow's hazard. */
  warningDays: [2, 5, 8, 11] as readonly number[],
  /** Days the hazard actually strikes (during sleep). */
  hazardDays: [3, 6, 9, 12] as readonly number[],
  bossWarningDay: 14,

  /** Chance a random event fires on a normal morning (0–1). */
  randomEventChance: 0.5,

  startingResources: {
    food: { current: 10, max: 50 },
    power: { current: 10, max: 50 },
    shield: { current: 10, max: 50 },
    health: { current: 10, max: 50 },
    oxygen: { current: 10, max: 30 },
    water: { current: 10, max: 30 },
  } as const satisfies Record<ResourceId, { current: number; max: number }>,

  /** Daily crew use of life-support resources. */
  dailyConsumption: {
    food: 2,
    water: 2,
    oxygen: 2,
  } as const,

  healthDelta: {
    allHealthy: 2,
    oneLow: -2,
    manyLow: -3,
  } as const,

  /**
   * Power allocation order: earlier facilities keep power first.
   * Shield shuts off first when short (decision O4).
   */
  powerPriority: [
    'oxygenGenerator',
    'waterRecycler',
    'greenhouse',
    'shieldGenerator',
  ] as readonly FacilityId[],

  startingFacilities: {
    mainBase: { status: 'operational' as const, producesPerDay: {}, powerUse: 0 },
    shieldGenerator: {
      status: 'operational' as const,
      // O1: passive shield recovery so the shield ending is reachable.
      producesPerDay: { shield: 1 } as Partial<Record<ResourceId, number>>,
      powerUse: 1,
    },
    powerStation: {
      status: 'operational' as const,
      producesPerDay: { power: 3 } as Partial<Record<ResourceId, number>>,
      powerUse: 0,
    },
    greenhouse: {
      status: 'operational' as const,
      producesPerDay: { food: 3 } as Partial<Record<ResourceId, number>>,
      powerUse: 1,
    },
    // O3: life-support starts damaged after the alien attack.
    oxygenGenerator: {
      status: 'damaged' as const,
      producesPerDay: { oxygen: 3 } as Partial<Record<ResourceId, number>>,
      powerUse: 1,
    },
    waterRecycler: {
      status: 'damaged' as const,
      producesPerDay: { water: 3 } as Partial<Record<ResourceId, number>>,
      powerUse: 1,
    },
  },

  tasks: {
    repairOxygenGenerator: {
      id: 'repairOxygenGenerator',
      name: 'Repair Oxygen Generator',
      description: 'Fix the broken pipes so it makes new oxygen every night.',
      category: 'lifeSupport' as const,
      facility: 'oxygenGenerator' as const,
      apCost: 2,
      maxLevel: 1,
    },
    repairWaterRecycler: {
      id: 'repairWaterRecycler',
      name: 'Repair Water Recycler',
      description: 'Fix the filters so it cleans water every night.',
      category: 'lifeSupport' as const,
      facility: 'waterRecycler' as const,
      apCost: 1,
      maxLevel: 1,
    },
    installSolarPanels: {
      id: 'installSolarPanels',
      name: 'Install Solar Panels',
      description: 'More panels = more power made every day.',
      category: 'power' as const,
      facility: 'powerStation' as const,
      apCost: 2,
      maxLevel: 3,
      powerProductionBonus: 2,
    },
    upgradeBatteries: {
      id: 'upgradeBatteries',
      name: 'Upgrade Batteries',
      description: 'Bigger batteries can store more power.',
      category: 'power' as const,
      facility: 'powerStation' as const,
      apCost: 2,
      maxLevel: 3,
      powerMaxBonus: 10,
    },
    reinforceHabitat: {
      id: 'reinforceHabitat',
      name: 'Reinforce Habitat',
      description: 'Stronger walls mean hazards damage the shield less.',
      category: 'shielding' as const,
      facility: 'mainBase' as const,
      apCost: 2,
      maxLevel: 1,
      shieldBlockAmount: 3,
    },
    buildRadiationShelter: {
      id: 'buildRadiationShelter',
      name: 'Build Radiation Shelter',
      description: 'A safe room that protects us from solar radiation.',
      category: 'shielding' as const,
      facility: 'mainBase' as const,
      apCost: 2,
      maxLevel: 1,
      radiationBlockAmount: 3,
    },
    /** O1 — active shield top-up so kids can push toward the shield ending. */
    chargeShield: {
      id: 'chargeShield',
      name: 'Charge Shield',
      description: 'Pump power into the barrier to make it stronger right now.',
      category: 'shielding' as const,
      facility: 'shieldGenerator' as const,
      apCost: 1,
      maxLevel: null as number | null,
      shieldGain: 5,
      powerCost: 2,
    },
    /** O1 — raise daily shield production. */
    upgradeShieldGenerator: {
      id: 'upgradeShieldGenerator',
      name: 'Upgrade Shield Generator',
      description: 'Tune the generator so it rebuilds more shield each night.',
      category: 'shielding' as const,
      facility: 'shieldGenerator' as const,
      apCost: 2,
      maxLevel: 3,
      shieldProductionBonus: 2,
      shieldMaxBonus: 10,
    },
    plantCrops: {
      id: 'plantCrops',
      name: 'Plant Crops',
      description: 'Plant seeds now — they will be ready to eat in 2 days.',
      category: 'food' as const,
      facility: 'greenhouse' as const,
      apCost: 1,
      maxLevel: null as number | null,
      cropReadyInDays: 2,
      cropAmount: 6,
    },
    expandGreenhouse: {
      id: 'expandGreenhouse',
      name: 'Expand Greenhouse',
      description: 'More room to store food and grow more each day.',
      category: 'food' as const,
      facility: 'greenhouse' as const,
      apCost: 2,
      maxLevel: 2,
      foodProductionBonus: 2,
      foodMaxBonus: 10,
    },
    /** O2 — health ending needs a reachable source of Health. */
    visitMedBay: {
      id: 'visitMedBay',
      name: 'Visit Med Bay',
      description: 'Treat the crew so Health goes up today.',
      category: 'lifeSupport' as const,
      facility: 'mainBase' as const,
      apCost: 1,
      maxLevel: null as number | null,
      healthGain: 4,
      foodCost: 1,
    },
  },

  hazards: [
    { id: 'oxygenLeak', name: 'Oxygen Leak', description: 'Damaged pipes let oxygen escape!', damage: { oxygen: 5 } },
    { id: 'waterContamination', name: 'Water Contamination', description: 'The Water Recycler got dirty!', damage: { water: 5 } },
    { id: 'solarFlare', name: 'Solar Flare', description: 'A solar storm zapped our electrical systems!', damage: { power: 6 } },
    { id: 'generatorMalfunction', name: 'Generator Malfunction', description: 'The main generator broke down for a while!', damage: { power: 5 } },
    { id: 'dustStorm', name: 'Dust Storm', description: 'A huge Martian dust storm hit the outpost!', damage: { shield: 7 } },
    { id: 'meteorShower', name: 'Meteor Shower', description: 'Meteors crashed into the outpost!', damage: { shield: 6, power: 6 } },
    { id: 'alienInvasion', name: 'Alien Invasion', description: 'A hungry alien demanded our food!', damage: { food: 6 } },
    { id: 'cropInfestation', name: 'Crop Infestation', description: 'Space pests nibbled the greenhouse crops!', damage: { food: 5 } },
  ] as const,

  randomEvents: [
    {
      id: 'undergroundIce',
      name: 'Underground Ice Discovery',
      message: 'The team found ice underground and melted it into water!',
      positive: true,
      changes: { water: 4 },
    },
    {
      id: 'supplyDiscovery',
      name: 'Supply Discovery',
      message: 'You found an old supply crate with food inside!',
      positive: true,
      changes: { food: 3 },
    },
    {
      id: 'alienSigns',
      name: 'Alien Discovery',
      message: 'Giant footprints were spotted near the outpost... the alien is still out there.',
      positive: true,
      changes: {},
    },
    {
      id: 'equipmentMalfunction',
      name: 'Equipment Malfunction',
      message: 'A wire came loose and some power was lost.',
      positive: false,
      changes: { power: -2 },
    },
    {
      id: 'smallOxygenLeak',
      name: 'Small Oxygen Leak',
      message: 'A tiny crack let some oxygen out. It is patched now!',
      positive: false,
      changes: { oxygen: -2 },
    },
  ] as const,

  facilityNames: {
    mainBase: 'Main Base',
    shieldGenerator: 'Shield Generator',
    powerStation: 'Power Station',
    greenhouse: 'Greenhouse',
    oxygenGenerator: 'Oxygen Generator',
    waterRecycler: 'Water Recycler',
  } as const satisfies Record<FacilityId, string>,
} as const;

export type GameConfig = typeof CONFIG;
