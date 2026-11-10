/**
 * Person A — headless balance simulator.
 * Verifies each ending strategy is reachable (O1/O2/O6) and idle play fails.
 *
 * Usage: npm run balance -- [runs]
 */
import { CONFIG } from '../../src/config/gameConfig';
import { createEngine } from '../../src/engine';
import type { GameState, Strategy } from '../../src/contract/types';

type Build = 'shield' | 'food' | 'power' | 'evacuate' | 'balanced' | 'idle';

/** Task priority lists aimed at each ending (survive first, then specialize). */
const ORDER: Record<Build, string[]> = {
  shield: [
    'repairOxygenGenerator',
    'repairWaterRecycler',
    'installSolarPanels',
    'chargeShield',
    'upgradeShieldGenerator',
    'reinforceHabitat',
    'buildRadiationShelter',
    'plantCrops',
  ],
  food: [
    'repairOxygenGenerator',
    'repairWaterRecycler',
    'plantCrops',
    'expandGreenhouse',
    'installSolarPanels',
    'chargeShield',
  ],
  power: [
    'repairOxygenGenerator',
    'repairWaterRecycler',
    'installSolarPanels',
    'upgradeBatteries',
    'plantCrops',
    'chargeShield',
  ],
  evacuate: [
    'repairOxygenGenerator',
    'repairWaterRecycler',
    'visitMedBay',
    'installSolarPanels',
    'plantCrops',
    'buildRadiationShelter',
    'chargeShield',
  ],
  balanced: [
    'repairOxygenGenerator',
    'repairWaterRecycler',
    'installSolarPanels',
    'plantCrops',
    'chargeShield',
    'visitMedBay',
    'expandGreenhouse',
    'upgradeShieldGenerator',
    'upgradeBatteries',
    'reinforceHabitat',
  ],
  idle: [],
};

const TARGET_STAT: Record<Exclude<Build, 'balanced' | 'idle'>, Strategy> = {
  shield: 'shield',
  food: 'food',
  power: 'power',
  evacuate: 'evacuate',
};

function shouldSkip(state: GameState, id: string): boolean {
  if (id === 'chargeShield' && state.resources.shield.current >= state.resources.shield.max - 1) {
    return true;
  }
  if (id === 'visitMedBay' && state.resources.health.current >= state.resources.health.max - 1) {
    return true;
  }
  return false;
}

function play(
  seed: number,
  build: Build,
): { result: 'win' | 'bad' | 'dead' | 'stuck'; strategy?: Strategy; final: Record<string, number> } {
  const engine = createEngine();
  let { state } = engine.newGame({ seed });
  const order = ORDER[build];

  for (let guard = 0; guard < 500; guard += 1) {
    if (state.phase !== 'playing') break;

    if (state.day >= CONFIG.finalDay) {
      const strategy =
        build === 'balanced' || build === 'idle'
          ? ([
              ['shield', state.resources.shield.current],
              ['food', state.resources.food.current],
              ['power', state.resources.power.current],
              ['evacuate', state.resources.health.current],
            ] as [Strategy, number][]).sort((a, b) => b[1] - a[1])[0]![0]
          : TARGET_STAT[build];
      ({ state } = engine.chooseStrategy(state, strategy));
      break;
    }

    let acted = false;
    for (const id of order) {
      const task = engine.getTasks(state).find((t) => t.id === id && t.available);
      if (!task || shouldSkip(state, id)) continue;
      ({ state } = engine.doTask(state, id));
      acted = true;
      break;
    }

    if (!acted || state.ap <= 0) {
      ({ state } = engine.sleep(state));
      if (state.phase !== 'playing') break;
      ({ state } = engine.startDay(state));
    }
  }

  const final = {
    food: state.resources.food.current,
    power: state.resources.power.current,
    shield: state.resources.shield.current,
    health: state.resources.health.current,
  };

  if (state.phase === 'won') return { result: 'win', strategy: state.outcome?.strategy, final };
  if (state.phase === 'lost') return { result: 'bad', strategy: state.outcome?.strategy, final };
  if (state.phase === 'dead') return { result: 'dead', final };
  return { result: 'stuck', final };
}

const runs = Number(process.argv[2] ?? 50);
const builds = Object.keys(ORDER) as Build[];

console.log(`Person A balance sim — ${runs} seeds × ${builds.length} builds`);
console.log(`Ending required ≥ ${CONFIG.endingRequired}\n`);

const endingReachable: Partial<Record<Strategy, boolean>> = {};

for (const build of builds) {
  const tallies: Record<string, number> = {};
  let targetWins = 0;
  for (let i = 0; i < runs; i += 1) {
    const { result, strategy } = play(2000 + i * 19, build);
    const key = strategy ? `${result}:${strategy}` : result;
    tallies[key] = (tallies[key] ?? 0) + 1;
    if (result === 'win' && strategy) {
      endingReachable[strategy] = true;
      if (build in TARGET_STAT && strategy === TARGET_STAT[build as keyof typeof TARGET_STAT]) {
        targetWins += 1;
      }
    }
  }
  const line = Object.entries(tallies)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join('  ');
  const note =
    build in TARGET_STAT ? `  (target hits ${targetWins}/${runs})` : '';
  console.log(`${build.padEnd(10)} ${line}${note}`);
}

console.log('\nEnding reachability (O1/O2/O6):');
for (const s of ['shield', 'food', 'power', 'evacuate'] as Strategy[]) {
  console.log(`  ${s.padEnd(10)} ${endingReachable[s] ? 'REACHABLE' : 'NOT SEEN — tune config'}`);
}
