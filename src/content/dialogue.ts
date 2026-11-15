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
  shieldGenerator: 'Radiation Shelter',
  powerStation: 'Power Station',
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

/** Shown next to the status word so status never relies on colour alone. */
export const STATUS_ICONS: Record<FacilityStatus, string> = {
  operational: '✔',
  damaged: '⚠',
  unpowered: '🔌',
  growing: '🌱',
};

// ---------- Story ----------

export const OPENING_SLIDES: { asset: string; text: string }[] = [
  { asset: 'cut_opening_1', text: 'Astronauts built a home on Mars.' },
  { asset: 'cut_opening_2', text: 'One day, a big object was found above the planet!' },
  { asset: 'cut_opening_3', text: 'Suddenly, the ground began to shake...' },
  { asset: 'cut_opening_4', text: 'It was a giant alien!' },
  { asset: 'cut_opening_5', text: 'It smashed the outpost. Machines broke. Supplies ran low.' },
  { asset: 'cut_opening_6', text: 'The crew sent a call for help to Earth.' },
  { asset: 'cut_opening_7', text: 'Help is here. It is YOU!' },
];

export const TUTORIAL: Line[] = [
  { speaker: 'jasslyn', text: "Hi! I'm Jasslyn. Help us fix the outpost." },
  { speaker: 'jasslyn', text: 'Stay alive until Day 15. Then the alien comes back!' },
  { speaker: 'jamie', text: "I'm Jamie. The bars up top are our supplies. Don't let them get too low!" },
  { speaker: 'jamie', text: 'AP = Action Points. Click a building to use them.' },
  { speaker: 'jasslyn', text: 'When AP is gone, press Sleep. Night uses supplies — and makes new ones.' },
];

export const BOSS_TEXT = 'Day 15. The alien is back! Which plan will stop it?';

// ---------- Characters you can click ----------

export const NPC_LINES: Record<'jasslyn' | 'jamie' | 'cat', string[]> = {
  jasslyn: [
    'The alien comes on Day 15. Be ready!',
    'Pick one plan: Shield, Food, Power, or Fight Back.',
    'Watch for warnings. Bad things come every few days.',
  ],
  jamie: [
    // Facts from NASA's Mars facts page (science.nasa.gov/mars/facts).
    'A day on Mars is called a sol. It lasts about 24.6 hours!',
    'Mars looks red because the iron in its rocks has rusted.',
    'Mars air is thin and mostly carbon dioxide — we need the Oxygen machine!',
    'Mars can get as cold as about −153 °C!',
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

// ---------- Real facts from NASA ----------
// Each hazard and life-support need is paired with a real fact, checked against the NASA page
// linked in `url`. Shown on warning, hazard and "What happened?" screens. Keep numbers exactly
// as the source states them; if you change a fact, re-check it on the source page.

export interface NasaFact {
  /** Short label shown above the fact. */
  label: 'Real Mars fact' | 'Real space fact';
  text: string;
  /** Page title, shown as the source link. */
  source: string;
  url: string;
}

const SOURCES = {
  dustStorms: {
    source: 'NASA: The Fact and Fiction of Martian Dust Storms',
    url: 'https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/',
  },
  solarStorm: {
    source: 'NASA: NASA Watches Mars Light Up During Epic Solar Storm',
    url: 'https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm/',
  },
  opportunity: {
    source: 'NASA Science: 10 Things: Massive Dust Storm on Mars',
    url: 'https://science.nasa.gov/solar-system/planets/mars/10-things-massive-dust-storm-on-mars/',
  },
  impacts: {
    source: 'NASA JPL: NASA Probe Counts Space Rock Impacts on Mars',
    url: 'https://www.jpl.nasa.gov/news/nasa-probe-counts-space-rock-impacts-on-mars/',
  },
  moxie: {
    source: "NASA: NASA's Oxygen-Generating Experiment MOXIE Completes Mars Mission",
    url: 'https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/',
  },
  water: {
    source: 'NASA: NASA Achieves Water Recovery Milestone on International Space Station',
    url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
  },
  plants: {
    source: 'NASA: Growing Plants in Space',
    url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/',
  },
  foodShelfLife: {
    source: 'NASA Technical Reports Server: Thermostabilized Shelf Life Study',
    url: 'https://ntrs.nasa.gov/citations/20090006887',
  },
  marsFacts: { source: 'NASA Science: Mars Facts', url: 'https://science.nasa.gov/mars/facts/' },
} as const;

const OXYGEN_FACT: NasaFact = {
  label: 'Real Mars fact',
  text: "NASA's MOXIE machine on the Perseverance rover made oxygen from the carbon dioxide in Mars's thin air: 122 grams, about what a small dog breathes in 10 hours.",
  ...SOURCES.moxie,
};
const WATER_FACT: NasaFact = {
  label: 'Real space fact',
  text: "The International Space Station recycles about 98% of its water, even water from the crew's breath, sweat and urine.",
  ...SOURCES.water,
};
const PLANTS_FACT: NasaFact = {
  label: 'Real space fact',
  text: 'Astronauts have grown lettuce, Chinese cabbage and kale in a space garden called Veggie, and eaten some of them!',
  ...SOURCES.plants,
};

export const HAZARD_FACTS: Record<string, NasaFact> = {
  dustStorm: {
    label: 'Real Mars fact',
    text: 'Big dust storms on Mars can cover the whole planet. The strongest winds reach about 60 miles per hour (about 100 km/h).',
    ...SOURCES.dustStorms,
  },
  solarFlare: {
    label: 'Real Mars fact',
    text: 'Mars has no magnetic field to block space radiation. One solar storm gave a dose like 30 chest X-rays. Cliffs or lava tubes would help shield astronauts.',
    ...SOURCES.solarStorm,
  },
  generatorMalfunction: {
    label: 'Real Mars fact',
    text: 'In 2018 a dust storm blocked the sunlight the Opportunity rover used for power, so it could not recharge. Curiosity has a nuclear battery that runs day and night.',
    ...SOURCES.opportunity,
  },
  meteorShower: {
    label: 'Real Mars fact',
    text: 'Mars has a much thinner atmosphere than Earth. More than 200 small space rocks hit Mars every year, making new craters.',
    ...SOURCES.impacts,
  },
  oxygenLeak: OXYGEN_FACT,
  waterContamination: WATER_FACT,
  cropInfestation: PLANTS_FACT,
  alienInvasion: {
    label: 'Real space fact',
    text: 'The alien is pretend, but packing food is a real problem! NASA expects food for a Mars mission to need to last 5 years.',
    ...SOURCES.foodShelfLife,
  },
};

/** Facts for the "What happened?" screen, by the supply that ran low. */
export const LIFE_SUPPORT_FACTS: Record<LifeSupportId, NasaFact> = {
  oxygen: OXYGEN_FACT,
  water: WATER_FACT,
  food: PLANTS_FACT,
};

/** Every NASA page the game's facts come from (for credits). */
export const NASA_FACT_SOURCES: { source: string; url: string }[] = Object.values(SOURCES);
export const BOSS_WARNING_TEXT = 'Alien tomorrow! Last day to prepare. Pick a plan: Shield, Food, Power, or Fight Back.';

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
  evacuate: { title: 'Fight Back', description: 'Stand together and fight the alien. Needs high Health.' },
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
    title: 'We Fought Back!',
    text: 'The strong, healthy crew stands together. The alien runs away!',
  },
  bad: {
    title: 'Oh No...',
    text: 'The plan failed. Try a different plan next time!',
  },
};

// ---------- Credits ----------

/** SI disclosure shown on the title screen (NASA Space Apps rules for SI-generated content). */
export const SI_CREDIT =
  'SI-generated (made with AI): logo, small icons marked "SI", shield effect, music and sound effects. All other art was drawn by our team.';
