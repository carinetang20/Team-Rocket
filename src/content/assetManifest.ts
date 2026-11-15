// Asset manifest — owned by Person B. Human-readable version: docs/asset-list.md (keep both in sync).
//
// Every image the game uses. Files go in public/assets/<file>. If a file is missing, the game
// shows a grey placeholder box at this exact size, so art can be dropped in with no code changes.

import type { FacilityId, Strategy } from '../contract/types';
import { MAP_BUILDINGS, MAP_SIZE, buildingForFacility, type BuildingId } from './mapLayout';

export interface AssetEntry {
  file: string;
  width: number;
  height: number;
  label: string;
}

export const ASSETS: Record<string, AssetEntry> = {
  bg_title: { file: 'backgrounds/title.png', width: 1920, height: 1080, label: 'Title background' },
  map_ground: { file: 'map/empty_map.png', width: 1440, height: 1024, label: 'Outpost map (no buildings)' },
  ui_logo: { file: 'ui/logo.svg', width: 960, height: 360, label: 'Game logo' },
  // Map-sized so it lines up with the map layers; faded in by Shield level (outpost.ts).
  facility_shield_dome: { file: 'facilities/shield_dome.svg', width: 1440, height: 1024, label: 'Shield dome overlay' },

  // Scene sprites and portraits are trimmed/scaled from the full art in characters/<name>.png.
  char_jasslyn_portrait: { file: 'characters/jasslyn_portrait.png', width: 400, height: 400, label: 'Jasslyn' },
  char_jasslyn_scene: { file: 'characters/jasslyn_scene.png', width: 206, height: 360, label: 'Jasslyn' },
  char_jamie_portrait: { file: 'characters/jamie_portrait.png', width: 400, height: 400, label: 'Jamie' },
  char_jamie_scene: { file: 'characters/jamie_scene.png', width: 229, height: 360, label: 'Jamie' },
  char_cat_portrait: { file: 'characters/miau_portrait.png', width: 400, height: 400, label: 'Cat' },
  char_cat_scene: { file: 'characters/miau_scene.png', width: 260, height: 171, label: 'Cat' },
  char_player_portrait: { file: 'characters/player_portrait.png', width: 400, height: 400, label: 'You' },
  char_player_scene: { file: 'characters/player_scene.png', width: 229, height: 360, label: 'You' },

  cut_opening_1: { file: 'cutscenes/opening_1.png', width: 1920, height: 1080, label: 'Opening 1: the outpost' },
  cut_opening_2: { file: 'cutscenes/opening_2.png', width: 1920, height: 1080, label: 'Opening 2: life on Mars' },
  cut_opening_3: { file: 'cutscenes/opening_3.png', width: 1920, height: 1080, label: 'Opening 3: the ground shakes' },
  cut_opening_4: { file: 'cutscenes/opening_4.png', width: 1920, height: 1080, label: 'Opening 4: alien attack' },
  cut_opening_5: { file: 'cutscenes/opening_5.png', width: 1920, height: 1080, label: 'Opening 5: broken outpost' },
  cut_opening_6: { file: 'cutscenes/opening_6.png', width: 1920, height: 1080, label: 'Opening 6: distress signal' },
  cut_opening_7: { file: 'cutscenes/opening_7.png', width: 1920, height: 1080, label: 'Opening 7: player arrives' },
};

// ---------- Map buildings ----------
// Each building layer is a full-map-size PNG (1440 × 1024), transparent except for that building,
// so all layers line up exactly when stacked. Thumbnails are the same art trimmed to the building.
// There is no separate art per status: the screen shows status with filters + icon + label.

const BUILDING_ART: Record<BuildingId, { file: string; thumbWidth: number; thumbHeight: number }> = {
  mainBase: { file: 'main_base', thumbWidth: 400, thumbHeight: 415 },
  radiationShelter: { file: 'radiation_shelter', thumbWidth: 400, thumbHeight: 163 },
  lifeSupport: { file: 'water_oxygen', thumbWidth: 400, thumbHeight: 213 },
  powerStation: { file: 'power_station', thumbWidth: 384, thumbHeight: 264 },
  greenhouse: { file: 'greenhouse', thumbWidth: 400, thumbHeight: 150 },
};

export function mapLayerAssetId(id: BuildingId): string {
  return `map_layer_${id}`;
}

/** Neon outline drawn just outside the building (hover / growing). Generated from the layer's shape. */
export function mapGlowAssetId(id: BuildingId): string {
  return `map_glow_${id}`;
}

export function mapThumbAssetId(id: BuildingId): string {
  return `map_thumb_${id}`;
}

/** Small picture for a facility (e.g. Report table): the thumbnail of the building it belongs to. */
export function facilityThumbAssetId(id: FacilityId): string {
  return mapThumbAssetId(buildingForFacility(id).id);
}

for (const b of MAP_BUILDINGS) {
  const art = BUILDING_ART[b.id];
  ASSETS[mapLayerAssetId(b.id)] = { file: `map/${art.file}.png`, width: MAP_SIZE.width, height: MAP_SIZE.height, label: b.name };
  ASSETS[mapGlowAssetId(b.id)] = { file: `map/glow/${art.file}.png`, width: MAP_SIZE.width, height: MAP_SIZE.height, label: `${b.name} glow` };
  ASSETS[mapThumbAssetId(b.id)] = { file: `map/thumbs/${art.file}.png`, width: art.thumbWidth, height: art.thumbHeight, label: b.name };
}

// ---------- Icons ----------

const ICONS = ['food', 'power', 'shield', 'health', 'oxygen', 'water', 'ap', 'day', 'sleep', 'base_management', 'warning', 'lock'];
for (const name of ICONS) {
  ASSETS[`icon_${name}`] = { file: `icons/${name}.svg`, width: 128, height: 128, label: name.replace('_', ' ').toUpperCase() };
}

// ---------- Task card art (placeholders until art arrives) ----------

const TASK_ART: Record<string, { file: string; label: string }> = {
  repairOxygenGenerator: { file: 'fix_oxygen', label: 'Fix Oxygen' },
  repairWaterRecycler: { file: 'fix_water', label: 'Fix Water' },
  installSolarPanels: { file: 'solar_panels', label: 'Solar Panels' },
  upgradeBatteries: { file: 'batteries', label: 'Batteries' },
  reinforceHabitat: { file: 'stronger_walls', label: 'Stronger Walls' },
  buildRadiationShelter: { file: 'safe_room', label: 'Safe Room' },
  chargeShield: { file: 'charge_shield', label: 'Charge Shield' },
  upgradeShieldGenerator: { file: 'upgrade_shield', label: 'Upgrade Shield' },
  plantCrops: { file: 'plant_crops', label: 'Plant Crops' },
  expandGreenhouse: { file: 'expand_greenhouse', label: 'Bigger Greenhouse' },
  visitMedBay: { file: 'med_bay', label: 'Med Bay' },
};

export function taskAssetId(taskId: string): string {
  return `task_${taskId}`;
}

for (const [id, art] of Object.entries(TASK_ART)) {
  ASSETS[taskAssetId(id)] = {
    file: `tasks/${art.file}.svg`,
    width: 256,
    height: 256,
    label: art.label,
  };
}

// ---------- Hazards ----------

const HAZARD_ART: Record<string, string> = {
  oxygenLeak: 'oxygen_leak',
  waterContamination: 'water_contamination',
  solarFlare: 'solar_flare',
  generatorMalfunction: 'generator_malfunction',
  dustStorm: 'dust_storm',
  meteorShower: 'meteor_shower',
  alienInvasion: 'alien_invasion',
  cropInfestation: 'crop_infestation',
};

export function hazardAssetId(hazardId: string): string {
  return `hazard_${hazardId}`;
}

for (const [id, file] of Object.entries(HAZARD_ART)) {
  ASSETS[hazardAssetId(id)] = { file: `hazards/${file}.png`, width: 1920, height: 1080, label: `Hazard: ${file.replace('_', ' ')}` };
}

// ---------- Endings ----------

export function endingAssetId(ending: Strategy | 'bad'): string {
  return `ending_${ending}`;
}

// The 'evacuate' strategy id is kept for the engine contract, but the player-facing ending is now
// "Fight Back" (decision D8), so its art file is named retaliate.png.
const ENDING_FILES: Record<Strategy | 'bad', string> = {
  shield: 'shield',
  food: 'food',
  power: 'power',
  evacuate: 'retaliate',
  bad: 'bad',
};
for (const [ending, file] of Object.entries(ENDING_FILES)) {
  ASSETS[endingAssetId(ending as Strategy | 'bad')] = { file: `endings/${file}.png`, width: 1920, height: 1080, label: `Ending: ${file}` };
}
