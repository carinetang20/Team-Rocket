// Game text — owned by Person B. All wording the player reads lives here so it can be
// edited without touching game logic. Keep sentences short and friendly (ages 7–12).

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
  cat: 'Cat (name TBD)',
  player: 'You',
};

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  food: 'Food',
  power: 'Power',
  shield: 'Shield',
  health: 'Health',
  oxygen: 'Oxygen',
  water: 'Water',
};

export const FACILITY_NAMES: Record<FacilityId, string> = {
  mainBase: 'Main Base',
  shieldGenerator: 'Shield Generator',
  powerStation: 'Power Station',
  greenhouse: 'Greenhouse',
  oxygenGenerator: 'Oxygen Generator',
  waterRecycler: 'Water Recycler',
};

export const STATUS_LABELS: Record<FacilityStatus, string> = {
  operational: 'Working',
  damaged: 'Broken',
  unpowered: 'No power',
  growing: 'Growing crops',
};

// ---------- Story ----------

export const OPENING_SLIDES: { asset: string; text: string }[] = [
  { asset: 'cut_opening_1', text: 'On Mars, a small team of astronauts worked hard to build their outpost.' },
  { asset: 'cut_opening_2', text: 'Then one night, a giant alien attacked and smashed most of the buildings!' },
  { asset: 'cut_opening_3', text: 'The team sent an emergency signal to Earth. Help is on the way... and that help is YOU!' },
];

export const TUTORIAL: Line[] = [
  { speaker: 'jasslyn', text: "Welcome to Mars, recruit! I'm Commander Jasslyn. A giant alien wrecked our outpost, and we need your help to rebuild it." },
  { speaker: 'jasslyn', text: 'Your mission: keep the crew alive until Day 15. The alien will come back the moment Day 15 begins, so we must be ready!' },
  { speaker: 'jamie', text: "Hi, I'm Jamie! The bars at the top show our Food, Power, Shield and Health, plus Oxygen and Water. If they get too low, we get sick." },
  { speaker: 'jamie', text: 'Every day you get Action Points (AP). Click a building to spend AP on tasks like repairs and upgrades.' },
  { speaker: 'jamie', text: 'Some of our machines are broken. Open the Base panel to see which ones need fixing!' },
  { speaker: 'jasslyn', text: 'When you run out of AP, or want to rest, press Sleep. Overnight we use up supplies, and our machines make new ones.' },
  { speaker: 'jamie', text: "Any AP you don't use is saved for tomorrow — but there's a limit. Good luck, astronaut!" },
];

export const BOSS_TEXT = 'The ground shakes... The alien is back! How will the team face it?';

// ---------- Characters you can click ----------

export const NPC_LINES: Record<'jasslyn' | 'jamie' | 'cat', string[]> = {
  jasslyn: [
    'Remember: the alien returns at the start of Day 15 — there is no time to prepare that day. Decide early which plan you will use to stop it!',
    'Each final plan needs one stat to be really high. Shield, Food, Power, or Health for evacuating.',
    'Check the warnings each morning. A hazard is coming every few days.',
  ],
  jamie: [
    "Fun fact: a day on Mars is called a 'sol'. It lasts about 24 hours and 40 minutes!",
    "Fun fact: Mars looks red because its dust contains iron oxide — that's rust!",
    'Fun fact: Olympus Mons on Mars is the tallest volcano we know of in the whole solar system!',
    'Fun fact: gravity on Mars is only about 38% of Earth’s. You could jump about two and a half times higher here!',
    'Fun fact: Mars has two small moons, called Phobos and Deimos.',
    "Fun fact: the air on Mars is very thin and mostly carbon dioxide. We can't breathe it — that's why the Oxygen Generator matters!",
    'Fun fact: Mars is freezing! The average temperature is about −60 °C.',
  ],
  cat: [
    'Mrrp? (The cat rubs against your space boots.)',
    'Purrrr... (The cat seems happy you are here.)',
    '(The cat stares at the food storage. Then at you. Then back at the food.)',
  ],
};

// ---------- Hazards ----------

export const HAZARD_HINTS: Record<string, string> = {
  oxygenLeak: 'Repair the Oxygen Generator and save up extra oxygen.',
  waterContamination: 'Repair the Water Recycler and save up extra water.',
  solarFlare: 'A Radiation Shelter and extra stored power will help.',
  generatorMalfunction: 'Save up extra power before tonight.',
  dustStorm: 'Reinforcing the habitat will protect the shield.',
  meteorShower: 'Reinforce the habitat and save up extra power.',
  alienInvasion: 'Have extra food ready — the alien is hungry!',
  cropInfestation: 'Save extra food in case the crops get damaged.',
};

export const GENERIC_HAZARD_HINT = 'Use your AP today to get ready!';
export const BOSS_WARNING_TEXT =
  'The alien returns tomorrow morning! Today is your LAST day to prepare. Which plan will you choose: Shield, Food, Power, or Evacuate?';

const PROTECTION_TIPS: Partial<Record<ResourceId, string>> = {
  shield: 'Reinforcing the habitat would have protected us!',
  power: 'Keeping extra power stored helps us survive hits like this.',
  oxygen: 'Extra stored oxygen helps us survive leaks.',
  water: 'Extra stored water helps when the recycler has problems.',
  food: 'Extra stored food keeps us safe when crops are lost.',
};

export function explainHazard(ev: EventOf<'hazardStruck'>): string[] {
  return ev.damage.map((d) => {
    const label = RESOURCE_LABELS[d.resource];
    if (d.blockedBy.length > 0) {
      const names = d.blockedBy.map((b) => b.name).join(' and ');
      return `Great planning! Our ${names} blocked ${d.base - d.final} ${label} damage. Without it, we would have lost ${d.base}.`;
    }
    const tip = PROTECTION_TIPS[d.resource];
    return `Ouch! We lost ${d.final} ${label}.${tip ? ' ' + tip : ''}`;
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
      return 'Everyone had enough food, water and oxygen, so health went up!';
    case 'oneLow':
      return `${listNames(ev.lowResources)} was too low, so health went down.`;
    case 'manyLow':
      return `${listNames(ev.lowResources)} were too low, so health went down a lot.`;
    case 'hazard':
      return 'The hazard hurt the crew.';
  }
}

const FIX_TIPS: Record<LifeSupportId, string> = {
  oxygen: 'Repair the Oxygen Generator early — it makes new oxygen every night!',
  water: 'Repair the Water Recycler — it is one of the cheapest tasks!',
  food: 'Plant crops early. They take a couple of days to grow, so plan ahead!',
};

export function lowWarningText(ev: EventOf<'lowResourceWarning'>): string {
  return `${RESOURCE_LABELS[ev.resource]} has been low for ${ev.nightsBelow} nights! Our health will keep dropping until we fix it. ${FIX_TIPS[ev.resource]}`;
}

// ---------- Game over (decision D3) ----------

export function deathExplanation(cause: DeathCause): { why: string[]; tips: string[] } {
  const why = cause.lowResources.map(
    (l) => `${RESOURCE_LABELS[l.resource]} was too low for ${l.nightsBelow} night${l.nightsBelow === 1 ? '' : 's'} in a row.`,
  );
  if (cause.finalBlow === 'hazard') why.push(`The ${cause.hazardName ?? 'hazard'} hit when the crew's health was already low.`);
  if (why.length === 0) why.push("The crew's health ran out.");

  const tips = cause.lowResources.map((l) => FIX_TIPS[l.resource]);
  tips.push('Open the Base panel every morning to spot broken machines early.');
  return { why, tips: [...new Set(tips)].slice(0, 2) };
}

// ---------- Final boss & endings ----------

export const STRATEGY_INFO: Record<Strategy, { title: string; description: string }> = {
  shield: { title: 'Activate the Barrier Shield', description: 'Power the shield up to full so the alien cannot break in.' },
  food: { title: 'Offer Food to the Alien', description: 'Give the alien a giant feast so it leaves happy.' },
  power: { title: 'Overload the Power Station', description: 'Zap the alien with a huge burst of electricity.' },
  evacuate: { title: 'Evacuate the Outpost', description: 'Fly everyone safely back to Earth. The crew must be healthy for the trip.' },
};

export const ENDING_TEXT: Record<Strategy | 'bad', { title: string; text: string }> = {
  shield: {
    title: 'The Shield Holds!',
    text: 'The alien pounds on the glowing barrier, but it cannot break through. Eventually it gives up and stomps away.',
  },
  food: {
    title: 'A Happy Alien',
    text: 'The alien gobbles up the giant feast. Full and satisfied, it wanders off without attacking.',
  },
  power: {
    title: 'Zap!',
    text: 'The alien smashes the Power Station — and gets a huge electric shock! It runs away and never comes back.',
  },
  evacuate: {
    title: 'Safe Journey Home',
    text: 'The healthy crew boards the rocket and blasts off. Everyone returns to Earth safe and sound.',
  },
  bad: {
    title: 'The Outpost Falls',
    text: 'The plan did not work. The alien destroys the outpost again... but every astronaut learns from their mistakes. Try again!',
  },
};
