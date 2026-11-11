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
      name: 'Fix Oxygen',
      description: 'Make Oxygen again each night.',
      category: 'lifeSupport' as const,
      facility: 'oxygenGenerator' as const,
      apCost: 2,
      maxLevel: 1,
    },
    repairWaterRecycler: {
      id: 'repairWaterRecycler',
      name: 'Fix Water',
      description: 'Make Water again each night.',
      category: 'lifeSupport' as const,
      facility: 'waterRecycler' as const,
      apCost: 1,
      maxLevel: 1,
    },
    installSolarPanels: {
      id: 'installSolarPanels',
      name: 'Add Solar Panels',
      description: 'More Power each night.',
      category: 'power' as const,
      facility: 'powerStation' as const,
      apCost: 2,
      maxLevel: 3,
      powerProductionBonus: 2,
    },
    upgradeBatteries: {
      id: 'upgradeBatteries',
      name: 'Bigger Batteries',
      description: 'Store more Power.',
      category: 'power' as const,
      facility: 'powerStation' as const,
      apCost: 2,
      maxLevel: 3,
      powerMaxBonus: 10,
    },
    reinforceHabitat: {
      id: 'reinforceHabitat',
      name: 'Stronger Walls',
      description: 'Hazards hurt Shield less.',
      category: 'shielding' as const,
      facility: 'mainBase' as const,
      apCost: 2,
      maxLevel: 1,
      shieldBlockAmount: 3,
    },
    buildRadiationShelter: {
      id: 'buildRadiationShelter',
      name: 'Safe Room',
      description: 'Blocks solar flare damage.',
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
      description: 'Spend Power. Gain Shield now.',
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
      name: 'Upgrade Shield',
      description: 'More Shield each night.',
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
      description: 'Food ready in 2 days.',
      category: 'food' as const,
      facility: 'greenhouse' as const,
      apCost: 1,
      maxLevel: null as number | null,
      cropReadyInDays: 2,
      cropAmount: 6,
    },
    expandGreenhouse: {
      id: 'expandGreenhouse',
      name: 'Bigger Greenhouse',
      description: 'More Food each night.',
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
      description: 'Spend Food. Gain Health now.',
      category: 'lifeSupport' as const,
      facility: 'mainBase' as const,
      apCost: 1,
      maxLevel: null as number | null,
      healthGain: 4,
      foodCost: 1,
    },
  },

  hazards: [
    { id: 'oxygenLeak', name: 'Oxygen Leak', description: 'Oxygen is leaking out!', damage: { oxygen: 5 } },
    { id: 'waterContamination', name: 'Dirty Water', description: 'The water got dirty!', damage: { water: 5 } },
    { id: 'solarFlare', name: 'Solar Flare', description: 'A solar storm hit our power!', damage: { power: 6 } },
    { id: 'generatorMalfunction', name: 'Power Break', description: 'The generator broke!', damage: { power: 5 } },
    { id: 'dustStorm', name: 'Dust Storm', description: 'A huge dust storm hit!', damage: { shield: 7 } },
    { id: 'meteorShower', name: 'Meteors', description: 'Meteors hit the outpost!', damage: { shield: 6, power: 6 } },
    { id: 'alienInvasion', name: 'Hungry Alien', description: 'An alien wants our food!', damage: { food: 6 } },
    { id: 'cropInfestation', name: 'Crop Bugs', description: 'Bugs ate some crops!', damage: { food: 5 } },
  ] as const,

  randomEvents: [
    {
      id: 'undergroundIce',
      name: 'Found Ice!',
      message: 'We melted ice into Water.',
      positive: true,
      changes: { water: 4 },
    },
    {
      id: 'supplyDiscovery',
      name: 'Found Food!',
      message: 'An old crate had Food inside.',
      positive: true,
      changes: { food: 3 },
    },
    {
      id: 'alienSigns',
      name: 'Alien Tracks',
      message: 'Big footprints nearby. The alien is close.',
      positive: true,
      changes: {},
    },
    {
      id: 'equipmentMalfunction',
      name: 'Loose Wire',
      message: 'We lost some Power.',
      positive: false,
      changes: { power: -2 },
    },
    {
      id: 'smallOxygenLeak',
      name: 'Tiny Leak',
      message: 'A little Oxygen leaked out.',
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
