// Outpost map layout — owned by Person B. Where things sit on the outpost map and which
// engine facilities each clickable building stands for. Layout data, not game balance.
//
// All positions are in MAP PIXELS (the art is 1440 × 1024). The screen converts them to
// percentages so the map can be shown at any size and everything stays lined up.

import type { FacilityId } from '../contract/types';
import type { Speaker } from './dialogue';

export const MAP_SIZE = { width: 1440, height: 1024 } as const;

/** A building the player can click on the map. One building can cover several engine facilities. */
export type BuildingId = 'mainBase' | 'radiationShelter' | 'lifeSupport' | 'powerStation' | 'greenhouse';

export interface MapBuilding {
  id: BuildingId;
  /** Name shown on the map label and pop-up title. */
  name: string;
  /** One short line explaining what the building does (shown in its pop-up). */
  blurb: string;
  /** Engine facilities this building stands for. More than one = the pop-up shows a section for each. */
  facilities: readonly FacilityId[];
  /** Centre of the name label, in map pixels. Picked so labels don't cover doors or signs. */
  label: { x: number; y: number };
}

/** Drawing order = back to front. If two buildings ever overlap, the later one wins clicks. */
export const MAP_BUILDINGS: readonly MapBuilding[] = [
  {
    id: 'radiationShelter',
    name: 'Radiation Shelter',
    blurb: 'Makes the shield that protects the base from storms and space rays.',
    facilities: ['shieldGenerator'],
    label: { x: 841, y: 295 },
  },
  {
    id: 'mainBase',
    name: 'Main Base',
    blurb: 'Where the crew lives, rests and stays safe.',
    facilities: ['mainBase'],
    label: { x: 275, y: 140 },
  },
  {
    // Oxygen and water are separate machines in the engine, but share one building on the map.
    id: 'lifeSupport',
    name: 'Water & Oxygen',
    blurb: 'Makes the air and clean water the crew needs every day.',
    facilities: ['oxygenGenerator', 'waterRecycler'],
    label: { x: 1040, y: 632 },
  },
  {
    id: 'powerStation',
    name: 'Power Station',
    blurb: 'Makes power for all the machines.',
    facilities: ['powerStation'],
    label: { x: 1215, y: 925 },
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    blurb: 'Grows food for the crew.',
    facilities: ['greenhouse'],
    label: { x: 578, y: 970 },
  },
];

export function getBuilding(id: BuildingId): MapBuilding {
  const b = MAP_BUILDINGS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown building: ${id}`);
  return b;
}

export function buildingForFacility(facility: FacilityId): MapBuilding {
  const b = MAP_BUILDINGS.find((x) => x.facilities.includes(facility));
  if (!b) throw new Error(`No map building covers facility: ${facility}`);
  return b;
}

export interface MapCharacter {
  speaker: Speaker;
  /** Centre of the character's feet, in map pixels. */
  x: number;
  feetY: number;
  /** Height on the map, in map pixels (width follows the art's shape). */
  height: number;
  /** false = just standing there (the player); true = click to talk. */
  talks: boolean;
}

export const MAP_CHARACTERS: readonly MapCharacter[] = [
  { speaker: 'jamie', x: 1320, feetY: 240, height: 175, talks: true },
  { speaker: 'player', x: 615, feetY: 560, height: 175, talks: false },
  { speaker: 'cat', x: 700, feetY: 672, height: 66, talks: true },
  { speaker: 'jasslyn', x: 120, feetY: 945, height: 175, talks: true },
];
