import { addStat } from "./stats.js";
import type { RandomEventDefinition, RandomEventId } from "./types.js";

export const RANDOM_EVENTS: Record<RandomEventId, RandomEventDefinition> = {
  oxygen_leak: {
    id: "oxygen_leak",
    name: "Oxygen leak",
    description: "A pipe is leaking air from the habitat.",
    severity: "bad",
    apply: (stats, _production, flags) => {
      const messages = ["Oxygen leak detected in the habitat!"];
      addStat(stats, "health", -3);
      messages.push("Health -3 from thin air.");
      if (!flags.oxygenGeneratorRepaired) {
        addStat(stats, "health", -2);
        messages.push("Oxygen generator still broken — extra Health -2.");
      }
      return messages;
    },
  },
  underground_ice: {
    id: "underground_ice",
    name: "Underground ice discovery",
    description: "Scanners found ice under the Martian soil — free water!",
    severity: "good",
    apply: (stats, production) => {
      addStat(stats, "health", 3);
      addStat(stats, "hunger", 2);
      production.oxygenPerDay += 1;
      return [
        "Ice discovery! Fresh water for the crew.",
        "Health +3, Hunger +2, daily oxygen +1.",
      ];
    },
  },
  equipment_malfunction: {
    id: "equipment_malfunction",
    name: "Equipment malfunction",
    description: "A key machine sputters and loses efficiency.",
    severity: "bad",
    apply: (stats, production) => {
      addStat(stats, "power", -3);
      production.powerPerDay = Math.max(0, production.powerPerDay - 1);
      return [
        "Equipment malfunction hit the power grid.",
        "Power -3, daily power production -1.",
      ];
    },
  },
  supply_discovery: {
    id: "supply_discovery",
    name: "Supply discovery",
    description: "A sealed Earth crate is found under the rubble.",
    severity: "good",
    apply: (stats) => {
      addStat(stats, "hunger", 4);
      addStat(stats, "power", 3);
      addStat(stats, "shield", 2);
      return [
        "Supply crate recovered from the wreckage!",
        "Hunger +4, Power +3, Shield +2.",
      ];
    },
  },
  alien_discovery: {
    id: "alien_discovery",
    name: "Alien discovery",
    description: "Strange tracks near the outpost. The crew is uneasy.",
    severity: "mixed",
    apply: (stats) => {
      addStat(stats, "shield", -2);
      addStat(stats, "health", -1);
      addStat(stats, "power", 2);
      return [
        "Alien tracks spotted! Crew on edge.",
        "Shield -2, Health -1, but scavenged alien tech: Power +2.",
      ];
    },
  },
};

export const RANDOM_EVENT_IDS = Object.keys(RANDOM_EVENTS) as RandomEventId[];
