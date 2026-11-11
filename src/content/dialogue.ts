// Game text — owned by Person B. All wording the player reads lives here so it can be
// edited without touching game logic. Keep sentences short and friendly (ages 7–11).

import type {
  DeathCause,
  EventOf,
  FacilityId,
  FacilityStatus,
  LifeSupportId,
  ResourceId,
  Strategy,
} from '../contract/types';

export type Speaker = 'jasslyn' | 'jamie' | 'cat' | 'player';

export interface Line {
  speaker: Speaker;
  text: string;
}

export const SPEAKER_NAMES: Record<Speaker, string> = {
  jasslyn: 'Commander Jasslyn',
  jamie: 'Jamie',
  cat: 'Cat',
  player: 'You',
};

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  food: 'Food',
  power: 'Power',
  shield: 'Shield',
  health: 'Health',
  oxygen: 'O2',
  water: 'H2O',
};

export const FACILITY_NAMES: Record<FacilityId, string> = {
  mainBase: 'Main Base',
  shieldGenerator: 'Shield',
  powerStation: 'Power',
  greenhouse: 'Greenhouse',
  oxygenGenerator: 'Oxygen',
  waterRecycler: 'Water',
};

export const STATUS_LABELS: Record<FacilityStatus, string> = {
  operational: 'Working',
  damaged: 'Broken',
  unpowered: 'No power',
  growing: 'Growing',
};

// ---------- Story ----------

export const OPENING_SLIDES: { asset: string; text: string }[] = [
  { asset: 'cut_opening_1', text: 'Astronauts built a home on Mars.' },
  { asset: 'cut_opening_2', text: 'Then a giant alien smashed it!' },
  { asset: 'cut_opening_3', text: 'They need YOU to help rebuild.' },
];

export const TUTORIAL: Line[] = [
  { speaker: 'jasslyn', text: "Hi! I'm Jasslyn. Help us fix the outpost." },
  { speaker: 'jasslyn', text: 'Stay alive until Day 15. Then the alien comes back!' },
  { speaker: 'jamie', text: "I'm Jamie. The bars up top are our supplies. Don't let them get too low!" },
  { speaker: 'jamie', text: 'AP = Action Points. Click a building to use them.' },
  { speaker: 'jasslyn', text: 'When AP is gone, press Sleep. Night uses supplies — and makes new ones.' },
];

export const BOSS_TEXT = 'The alien is back! Pick a plan.';

// ---------- Characters you can click ----------

export const NPC_LINES: Record<'jasslyn' | 'jamie' | 'cat', string[]> = {
  jasslyn: [
    'The alien comes on Day 15. Be ready!',
    'Pick one plan: Shield, Food, Power, or Health.',
    'Watch for warnings. Bad things come every few days.',
  ],
  jamie: [
    'A day on Mars is called a sol!',
    'Mars is red because of rusty dust.',
    "Mars air isn't safe to breathe — we need the Oxygen machine!",
    'Mars is really cold — about −60 °C.',
  ],
  cat: [
    'Mrrp?',
    'Purrrr...',
    '(The cat looks at the food. Then at you.)',
  ],
};

// ---------- Hazards ----------

export const HAZARD_HINTS: Record<string, string> = {
  oxygenLeak: 'Fix Oxygen. Save extra Oxygen.',
  waterContamination: 'Fix Water. Save extra Water.',
  solarFlare: 'Build a Radiation Shelter. Save Power.',
  generatorMalfunction: 'Save extra Power.',
  dustStorm: 'Reinforce the base to protect Shield.',
  meteorShower: 'Reinforce the base. Save Power.',
  alienInvasion: 'Save extra Food!',
  cropInfestation: 'Save extra Food.',
};

export const GENERIC_HAZARD_HINT = 'Use your AP to get ready!';
export const BOSS_WARNING_TEXT = 'Alien tomorrow! Last day to prepare. Pick a plan: Shield, Food, Power, or Evacuate.';

const PROTECTION_TIPS: Partial<Record<ResourceId, string>> = {
  shield: 'Stronger walls would help next time.',
  power: 'Extra Power helps next time.',
  oxygen: 'Extra Oxygen helps next time.',
  water: 'Extra Water helps next time.',
  food: 'Extra Food helps next time.',
};

export function explainHazard(ev: EventOf<'hazardStruck'>): string[] {
  return ev.damage.map((d) => {
    const label = RESOURCE_LABELS[d.resource];
    if (d.blockedBy.length > 0) {
      return `Nice! We blocked ${d.base - d.final} ${label}.`;
    }
    const tip = PROTECTION_TIPS[d.resource];
    return `Lost ${d.final} ${label}.${tip ? ` ${tip}` : ''}`;
  });
}

// ---------- Health & warnings ----------

function listNames(resources: ResourceId[]): string {
  const names = resources.map((r) => RESOURCE_LABELS[r]);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function healthReasonText(ev: EventOf<'healthChanged'>): string {
  switch (ev.reason) {
    case 'allHealthy':
      return ev.delta > 0 ? 'Supplies were OK — Health up!' : 'Health is full.';
    case 'oneLow':
      return `${listNames(ev.lowResources)} was low — Health down.`;
    case 'manyLow':
      return `${listNames(ev.lowResources)} were low — Health down a lot.`;
    case 'hazard':
      return 'The hazard hurt the crew.';
  }
}

const FIX_TIPS: Record<LifeSupportId, string> = {
  oxygen: 'Fix the Oxygen machine early!',
  water: 'Fix the Water machine — it is cheap!',
  food: 'Plant crops early. They take 2 days.',
};

export function lowWarningText(ev: EventOf<'lowResourceWarning'>): string {
  return `${RESOURCE_LABELS[ev.resource]} low for ${ev.nightsBelow} nights! ${FIX_TIPS[ev.resource]}`;
}

// ---------- Game over (decision D3) ----------

export function deathExplanation(cause: DeathCause): { why: string[]; tips: string[] } {
  const why = cause.lowResources.map(
    (l) => `${RESOURCE_LABELS[l.resource]} was low for ${l.nightsBelow} night${l.nightsBelow === 1 ? '' : 's'}.`,
  );
  if (cause.finalBlow === 'hazard') why.push(`A ${cause.hazardName ?? 'hazard'} hit when Health was low.`);
  if (why.length === 0) why.push('Health ran out.');

  const tips = cause.lowResources.map((l) => FIX_TIPS[l.resource]);
  tips.push('Check Base each morning for broken machines.');
  return { why, tips: [...new Set(tips)].slice(0, 2) };
}

// ---------- Final boss & endings ----------

export const STRATEGY_INFO: Record<Strategy, { title: string; description: string }> = {
  shield: { title: 'Use the Shield', description: 'Block the alien with a strong shield.' },
  food: { title: 'Give Food', description: 'Feed the alien so it leaves happy.' },
  power: { title: 'Zap with Power', description: 'Shock the alien with lots of power.' },
  evacuate: { title: 'Fly Home', description: 'Escape to Earth. Needs high Health.' },
};

export const ENDING_TEXT: Record<Strategy | 'bad', { title: string; text: string }> = {
  shield: {
    title: 'Shield Wins!',
    text: 'The alien cannot break the shield. It stomps away.',
  },
  food: {
    title: 'Happy Alien',
    text: 'The alien eats the feast and leaves.',
  },
  power: {
    title: 'Zap!',
    text: 'A big shock scares the alien away!',
  },
  evacuate: {
    title: 'Home Safe',
    text: 'The crew flies home to Earth.',
  },
  bad: {
    title: 'Oh No...',
    text: 'The plan failed. Try a different plan next time!',
  },
};
