import { CONFIG } from "./config.js";
import { addStat, applyMitigatedDamage, shieldMitigation } from "./stats.js";
import type { HazardDefinition, HazardId } from "./types.js";

export const HAZARDS: Record<HazardId, HazardDefinition> = {
  oxygen_leak: {
    id: "oxygen_leak",
    name: "Oxygen leak",
    category: "life_support",
    description: "A damaged pipe vents precious oxygen into the Martian air.",
    apply: (stats, _p, flags) => {
      const messages = ["Hazard: Oxygen leak!"];
      applyMitigatedDamage(stats, "health", 4);
      messages.push(`Health damaged (shield mitigated ${Math.round(shieldMitigation(stats) * 100)}%).`);
      if (!flags.oxygenGeneratorRepaired) {
        addStat(stats, "health", -3);
        messages.push("Unrepaired oxygen generator: extra Health -3.");
      }
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  water_contamination: {
    id: "water_contamination",
    name: "Water contamination",
    category: "life_support",
    description: "The recycler is contaminated — water and health suffer.",
    apply: (stats, production, flags) => {
      const messages = ["Hazard: Water contamination!"];
      applyMitigatedDamage(stats, "health", 3);
      applyMitigatedDamage(stats, "hunger", 2);
      if (!flags.waterRecyclerRepaired) {
        production.oxygenPerDay = Math.max(0, production.oxygenPerDay - 1);
        messages.push("Recycler not fixed — daily oxygen -1.");
      }
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  solar_flare: {
    id: "solar_flare",
    name: "Solar flare",
    category: "power",
    description: "A solar storm fries electrical systems.",
    apply: (stats, production, flags, spaceWeatherMultiplier) => {
      const messages = ["Hazard: Solar flare!"];
      const raw = Math.round(6 * spaceWeatherMultiplier);
      applyMitigatedDamage(stats, "power", raw);
      if (!flags.batteriesUpgraded) {
        production.powerPerDay = Math.max(0, production.powerPerDay - 1);
        messages.push("No upgraded batteries — daily power -1.");
      }
      if (flags.radiationShelterBuilt) {
        addStat(stats, "health", 2);
        messages.push("Radiation shelter protects the crew: Health +2.");
      } else {
        applyMitigatedDamage(stats, "health", Math.round(3 * spaceWeatherMultiplier));
        messages.push("No radiation shelter — crew takes radiation damage.");
      }
      messages.push(`Space weather multiplier ×${spaceWeatherMultiplier.toFixed(2)}.`);
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  generator_malfunction: {
    id: "generator_malfunction",
    name: "Generator malfunction",
    category: "power",
    description: "The main generator coughs and goes quiet.",
    apply: (stats, production, flags) => {
      const messages = ["Hazard: Generator malfunction!"];
      applyMitigatedDamage(stats, "power", 5);
      production.powerPerDay = Math.max(0, production.powerPerDay - 1);
      if (!flags.solarPanelsInstalled) {
        addStat(stats, "power", -3);
        messages.push("No solar backup — extra Power -3.");
      }
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  dust_storm: {
    id: "dust_storm",
    name: "Dust storm",
    category: "shielding",
    description: "A Martian dust storm batters the outpost.",
    apply: (stats, production, flags, spaceWeatherMultiplier) => {
      const messages = ["Hazard: Dust storm!"];
      applyMitigatedDamage(stats, "shield", Math.round(5 * spaceWeatherMultiplier));
      applyMitigatedDamage(stats, "health", 3);
      if (!flags.habitatReinforced) {
        addStat(stats, "shield", -3);
        messages.push("Habitat not reinforced — extra Shield -3.");
      }
      // Dust cuts solar input
      production.powerPerDay = Math.max(0, production.powerPerDay - 1);
      messages.push("Dust covers panels — daily power -1.");
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  meteor_shower: {
    id: "meteor_shower",
    name: "Meteor shower",
    category: "shielding",
    description: "Meteors streak across the sky and slam the perimeter.",
    apply: (stats, _p, flags) => {
      const messages = ["Hazard: Meteor shower!"];
      applyMitigatedDamage(stats, "shield", 6);
      applyMitigatedDamage(stats, "power", 3);
      if (!flags.habitatReinforced) {
        addStat(stats, "health", -3);
        messages.push("Weak habitat — meteors injure crew: Health -3.");
      }
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  alien_invasion: {
    id: "alien_invasion",
    name: "Alien invasion",
    category: "food",
    description: "Hungry aliens demand food from the outpost!",
    apply: (stats) => {
      const messages = ["Hazard: Alien invasion — they want food!"];
      const foodTaken = Math.min(stats.hunger.current, 6);
      addStat(stats, "hunger", -foodTaken);
      messages.push(`Aliens took Hunger -${foodTaken}.`);
      if (stats.hunger.current < 6) {
        addStat(stats, "health", -3);
        messages.push("Not enough food to satisfy them — Health -3.");
      }
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
  crop_infestation: {
    id: "crop_infestation",
    name: "Crop infestation",
    category: "food",
    description: "Space pests chew through the greenhouse.",
    apply: (stats, production, flags) => {
      const messages = ["Hazard: Crop infestation!"];
      applyMitigatedDamage(stats, "hunger", 4);
      production.foodPerDay = Math.max(0, production.foodPerDay - 1);
      messages.push("Daily food production -1.");
      if (!flags.greenhouseExpanded && flags.cropsPlanted) {
        production.foodPerDay = Math.max(0, production.foodPerDay - 1);
        messages.push("Small greenhouse hit harder — extra daily food -1.");
      }
      maybeLowShieldPenalty(stats, messages);
      return messages;
    },
  },
};

export const HAZARD_IDS = Object.keys(HAZARDS) as HazardId[];

function maybeLowShieldPenalty(
  stats: Parameters<HazardDefinition["apply"]>[0],
  messages: string[],
): void {
  if (stats.shield.current < CONFIG.lowShieldThreshold) {
    addStat(stats, "health", -CONFIG.lowShieldExtraHealthLoss);
    messages.push(
      `Shield below ${CONFIG.lowShieldThreshold}: extra Health -${CONFIG.lowShieldExtraHealthLoss}.`,
    );
  }
}

export function isHazardDay(day: number): boolean {
  return (CONFIG.hazardDays as readonly number[]).includes(day);
}
