import { CONFIG } from '../config/gameConfig';
import type { GameState, ResourceChange, TaskEffectPreview, TaskId, TaskView } from '../contract/types';
import { changeResource, raiseMax } from './resources';

type TaskDef = (typeof CONFIG.tasks)[keyof typeof CONFIG.tasks];

export const TASK_LIST: TaskDef[] = Object.values(CONFIG.tasks);

export function getTask(taskId: TaskId): TaskDef | undefined {
  return TASK_LIST.find((t) => t.id === taskId);
}

/** Preview what the task will change so the UI can show +/− before spending AP. */
export function previewEffects(task: TaskDef): TaskEffectPreview[] {
  const t = CONFIG.tasks;
  switch (task.id) {
    case t.repairOxygenGenerator.id:
      return [{ delta: 0, kind: 'info', note: 'Oxygen works again' }];
    case t.repairWaterRecycler.id:
      return [{ delta: 0, kind: 'info', note: 'Water works again' }];
    case t.installSolarPanels.id:
      return [{ resource: 'power', delta: t.installSolarPanels.powerProductionBonus, kind: 'perDay' }];
    case t.upgradeBatteries.id:
      return [{ resource: 'power', delta: t.upgradeBatteries.powerMaxBonus, kind: 'max' }];
    case t.reinforceHabitat.id:
      return [{ delta: 0, kind: 'info', note: `−${t.reinforceHabitat.shieldBlockAmount} Shield damage` }];
    case t.buildRadiationShelter.id:
      return [{ delta: 0, kind: 'info', note: `−${t.buildRadiationShelter.radiationBlockAmount} flare damage` }];
    case t.chargeShield.id:
      return [
        { resource: 'power', delta: -t.chargeShield.powerCost, kind: 'now' },
        { resource: 'shield', delta: t.chargeShield.shieldGain, kind: 'now' },
      ];
    case t.upgradeShieldGenerator.id:
      return [
        { resource: 'shield', delta: t.upgradeShieldGenerator.shieldProductionBonus, kind: 'perDay' },
        { resource: 'shield', delta: t.upgradeShieldGenerator.shieldMaxBonus, kind: 'max' },
      ];
    case t.plantCrops.id:
      return [
        {
          resource: 'food',
          delta: t.plantCrops.cropAmount,
          kind: 'delayed',
          readyInDays: t.plantCrops.cropReadyInDays,
        },
      ];
    case t.expandGreenhouse.id:
      return [
        { resource: 'food', delta: t.expandGreenhouse.foodProductionBonus, kind: 'perDay' },
        { resource: 'food', delta: t.expandGreenhouse.foodMaxBonus, kind: 'max' },
      ];
    case t.visitMedBay.id:
      return [
        { resource: 'food', delta: -t.visitMedBay.foodCost, kind: 'now' },
        { resource: 'health', delta: t.visitMedBay.healthGain, kind: 'now' },
      ];
    default:
      return [];
  }
}

export function toTaskView(state: GameState, task: TaskDef): TaskView {
  const level = state.upgrades[task.id] ?? 0;
  let lockedReason: string | undefined;

  if (state.phase !== 'playing') {
    lockedReason = 'Game over.';
  } else if (state.day >= CONFIG.finalDay) {
    lockedReason = 'Alien is here — no tasks.';
  } else if (task.maxLevel !== null && level >= task.maxLevel) {
    lockedReason = 'Already maxed!';
  } else if (
    (task.id === 'plantCrops' || task.id === 'expandGreenhouse') &&
    state.facilities.greenhouse.status === 'damaged'
  ) {
    lockedReason = 'Fix Greenhouse first.';
  } else if (
    (task.id === 'chargeShield' || task.id === 'upgradeShieldGenerator') &&
    state.facilities.shieldGenerator.status === 'damaged'
  ) {
    lockedReason = 'Fix Shield first.';
  } else if (
    task.id === 'chargeShield' &&
    'powerCost' in task &&
    state.resources.power.current < task.powerCost
  ) {
    lockedReason = `Need ${task.powerCost} Power.`;
  } else if (
    task.id === 'visitMedBay' &&
    'foodCost' in task &&
    state.resources.food.current < task.foodCost
  ) {
    lockedReason = `Need ${task.foodCost} Food.`;
  } else if (state.ap < task.apCost) {
    lockedReason = `Need ${task.apCost} AP (you have ${state.ap}).`;
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
    effects: previewEffects(task),
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
