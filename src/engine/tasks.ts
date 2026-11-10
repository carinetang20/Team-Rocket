import { CONFIG } from '../config/gameConfig';
import type { GameState, ResourceChange, TaskId, TaskView } from '../contract/types';
import { changeResource, raiseMax } from './resources';

type TaskDef = (typeof CONFIG.tasks)[keyof typeof CONFIG.tasks];

export const TASK_LIST: TaskDef[] = Object.values(CONFIG.tasks);

export function getTask(taskId: TaskId): TaskDef | undefined {
  return TASK_LIST.find((t) => t.id === taskId);
}

export function toTaskView(state: GameState, task: TaskDef): TaskView {
  const level = state.upgrades[task.id] ?? 0;
  let lockedReason: string | undefined;

  if (state.phase !== 'playing') {
    lockedReason = 'The game is over.';
  } else if (state.day >= CONFIG.finalDay) {
    lockedReason = 'The alien is here — no more tasks today.';
  } else if (task.maxLevel !== null && level >= task.maxLevel) {
    lockedReason = 'Already fully upgraded!';
  } else if (
    (task.id === 'plantCrops' || task.id === 'expandGreenhouse') &&
    state.facilities.greenhouse.status === 'damaged'
  ) {
    lockedReason = 'The Greenhouse must be working first.';
  } else if (
    (task.id === 'chargeShield' || task.id === 'upgradeShieldGenerator') &&
    state.facilities.shieldGenerator.status === 'damaged'
  ) {
    lockedReason = 'The Shield Generator must be working first.';
  } else if (
    task.id === 'chargeShield' &&
    'powerCost' in task &&
    state.resources.power.current < task.powerCost
  ) {
    lockedReason = `Need ${task.powerCost} Power to charge the shield.`;
  } else if (
    task.id === 'visitMedBay' &&
    'foodCost' in task &&
    state.resources.food.current < task.foodCost
  ) {
    lockedReason = `Need ${task.foodCost} Food for med supplies.`;
  } else if (state.ap < task.apCost) {
    lockedReason = `Not enough AP — you need ${task.apCost} but have ${state.ap}.`;
  }

  return {
    id: task.id,
    name: task.name,
    description: task.description,
    category: task.category,
    facility: task.facility,
    apCost: task.apCost,
    level,
    maxLevel: task.maxLevel,
    available: lockedReason === undefined,
    lockedReason,
  };
}

export function applyTask(state: GameState, task: TaskDef): ResourceChange[] {
  const changes: ResourceChange[] = [];
  const t = CONFIG.tasks;

  switch (task.id) {
    case t.repairOxygenGenerator.id:
      state.facilities.oxygenGenerator.status = 'operational';
      break;
    case t.repairWaterRecycler.id:
      state.facilities.waterRecycler.status = 'operational';
      break;
    case t.installSolarPanels.id: {
      const f = state.facilities.powerStation;
      f.producesPerDay.power = (f.producesPerDay.power ?? 0) + t.installSolarPanels.powerProductionBonus;
      f.level += 1;
      break;
    }
    case t.upgradeBatteries.id:
      changes.push(raiseMax(state, 'power', t.upgradeBatteries.powerMaxBonus, task.name));
      state.facilities.powerStation.level += 1;
      break;
    case t.reinforceHabitat.id:
    case t.buildRadiationShelter.id:
      // Protection is applied during hazards via upgrade flags.
      break;
    case t.chargeShield.id:
      changes.push(changeResource(state, 'power', -t.chargeShield.powerCost, task.name));
      changes.push(changeResource(state, 'shield', t.chargeShield.shieldGain, task.name));
      break;
    case t.upgradeShieldGenerator.id: {
      const f = state.facilities.shieldGenerator;
      f.producesPerDay.shield =
        (f.producesPerDay.shield ?? 0) + t.upgradeShieldGenerator.shieldProductionBonus;
      f.level += 1;
      changes.push(
        raiseMax(state, 'shield', t.upgradeShieldGenerator.shieldMaxBonus, task.name),
      );
      break;
    }
    case t.plantCrops.id:
      state.crops.push({
        readyOnDay: state.day + t.plantCrops.cropReadyInDays,
        amount: t.plantCrops.cropAmount,
      });
      if (state.facilities.greenhouse.status === 'operational') {
        state.facilities.greenhouse.status = 'growing';
      }
      break;
    case t.expandGreenhouse.id: {
      const f = state.facilities.greenhouse;
      f.producesPerDay.food = (f.producesPerDay.food ?? 0) + t.expandGreenhouse.foodProductionBonus;
      f.level += 1;
      changes.push(raiseMax(state, 'food', t.expandGreenhouse.foodMaxBonus, task.name));
      break;
    }
    case t.visitMedBay.id:
      changes.push(changeResource(state, 'food', -t.visitMedBay.foodCost, task.name));
      changes.push(changeResource(state, 'health', t.visitMedBay.healthGain, task.name));
      break;
    default:
      break;
  }

  return changes;
}
