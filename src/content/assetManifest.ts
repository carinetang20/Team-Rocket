// Asset manifest — owned by Person B. Human-readable version: docs/asset-list.md (keep both in sync).
//
// Every image the game uses. Files go in public/assets/<file>. If a file is missing, the game
// shows a grey placeholder box at this exact size, so art can be dropped in with no code changes.

import type { FacilityId, FacilityStatus, Strategy } from '../contract/types';
import { FACILITY_IDS } from '../contract/types';

export interface AssetEntry {
  file: string;
  width: number;
  height: number;
  label: string;
}

export const ASSETS: Record<string, AssetEntry> = {
  bg_title: { file: 'backgrounds/title.png', width: 1920, height: 1080, label: 'Title background' },
  bg_outpost: { file: 'backgrounds/outpost.png', width: 1920, height: 1080, label: 'Outpost background' },
  ui_logo: { file: 'ui/logo.png', width: 960, height: 360, label: 'Game logo' },
  facility_shield_dome: { file: 'facilities/shield_dome.png', width: 1920, height: 1080, label: 'Shield dome overlay' },

  char_jasslyn_portrait: { file: 'characters/jasslyn_portrait.png', width: 400, height: 400, label: 'Jasslyn' },
  char_jasslyn_scene: { file: 'characters/jasslyn_scene.png', width: 200, height: 360, label: 'Jasslyn' },
  char_jamie_portrait: { file: 'characters/jamie_portrait.png', width: 400, height: 400, label: 'Jamie' },
  char_jamie_scene: { file: 'characters/jamie_scene.png', width: 200, height: 360, label: 'Jamie' },
  char_cat_portrait: { file: 'characters/cat_portrait.png', width: 400, height: 400, label: 'Cat' },
  char_cat_scene: { file: 'characters/cat_scene.png', width: 160, height: 140, label: 'Cat' },
  char_player_portrait: { file: 'characters/player_portrait.png', width: 400, height: 400, label: 'You' },
  char_alien_boss: { file: 'characters/alien_boss.png', width: 1200, height: 1000, label: 'Alien boss' },

  cut_opening_1: { file: 'cutscenes/opening_1.png', width: 1920, height: 1080, label: 'Opening 1: the outpost' },
  cut_opening_2: { file: 'cutscenes/opening_2.png', width: 1920, height: 1080, label: 'Opening 2: alien attack' },
  cut_opening_3: { file: 'cutscenes/opening_3.png', width: 1920, height: 1080, label: 'Opening 3: distress signal' },
  cut_boss_arrives: { file: 'cutscenes/boss_arrives.png', width: 1920, height: 1080, label: 'The alien returns' },
  cut_game_over: { file: 'cutscenes/game_over.png', width: 1920, height: 1080, label: 'Game over' },
};

// ---------- Facilities ----------

const FACILITY_ART: Record<FacilityId, { file: string; width: number; height: number; label: string }> = {
  mainBase: { file: 'main_base', width: 400, height: 300, label: 'Main Base' },
  shieldGenerator: { file: 'shield_generator', width: 300, height: 300, label: 'Shield Generator' },
  powerStation: { file: 'power_station', width: 400, height: 260, label: 'Power Station' },
  greenhouse: { file: 'greenhouse', width: 400, height: 260, label: 'Greenhouse' },
  oxygenGenerator: { file: 'oxygen_generator', width: 260, height: 300, label: 'Oxygen Generator' },
  waterRecycler: { file: 'water_recycler', width: 260, height: 300, label: 'Water Recycler' },
};

const BASE_STATUSES: FacilityStatus[] = ['operational', 'damaged', 'unpowered'];

export function facilityAssetId(id: FacilityId, status: FacilityStatus): string {
  // Only the Greenhouse has a "growing" picture; others reuse "operational".
  const s = status === 'growing' && id !== 'greenhouse' ? 'operational' : status;
  return `facility_${id}_${s}`;
}

for (const id of FACILITY_IDS) {
  const art = FACILITY_ART[id];
  const statuses = id === 'greenhouse' ? [...BASE_STATUSES, 'growing' as const] : BASE_STATUSES;
  for (const status of statuses) {
    ASSETS[facilityAssetId(id, status)] = {
      file: `facilities/${art.file}_${status}.png`,
      width: art.width,
      height: art.height,
      label: `${art.label} (${status})`,
    };
  }
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

for (const ending of ['shield', 'food', 'power', 'evacuate', 'bad'] as const) {
  ASSETS[endingAssetId(ending)] = { file: `endings/${ending}.png`, width: 1920, height: 1080, label: `Ending: ${ending}` };
}
