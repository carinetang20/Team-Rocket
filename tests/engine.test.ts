import { describe, expect, it } from "vitest";
import { GameEngine } from "../src/engine/engine.js";
import { CONFIG, createStartingStats } from "../src/engine/config.js";
import { resolveBoss } from "../src/engine/boss.js";
import { deserializeState, serializeState } from "../src/engine/save.js";
import { getCuratedSpaceWeather } from "../src/data/nasa/curated.js";

describe("GameEngine", () => {
  it("starts on sol 1 with 3 AP and base stats", async () => {
    const engine = new GameEngine({ seed: 42, useCuratedWeather: true });
    const result = await engine.startGame();
    expect(result.ok).toBe(true);
    const view = engine.getView();
    expect(view.day).toBe(1);
    expect(view.ap).toBe(CONFIG.dailyApGrant);
    expect(view.stats.hunger.current).toBe(CONFIG.startingStat);
    expect(view.phase).toBe("acting");
    expect(view.availableTasks.length).toBeGreaterThan(0);
  });

  it("rejects tasks that cost more AP than available", async () => {
    const engine = new GameEngine({ seed: 7, useCuratedWeather: true });
    await engine.startGame();
    await engine.doTask("plant_crops");
    await engine.doTask("emergency_ration_run");
    const result = await engine.doTask("repair_oxygen");
    expect(result.ok).toBe(false);
  });

  it("applies trade-offs when planting crops", async () => {
    const engine = new GameEngine({ seed: 9, useCuratedWeather: true });
    await engine.startGame();
    const before = engine.getView().stats;
    const result = await engine.doTask("plant_crops");
    expect(result.ok).toBe(true);
    const after = engine.getView().stats;
    expect(after.hunger.current).toBeGreaterThan(before.hunger.current);
    expect(after.power.current).toBeLessThan(before.power.current);
  });

  it("carries leftover AP up to the save cap", async () => {
    const engine = new GameEngine({ seed: 11, useCuratedWeather: true });
    await engine.startGame();
    await engine.sleep();
    const view = engine.getView();
    if (view.phase === "hazard") engine.acknowledgeHazard();
    expect(engine.getView().ap).toBe(CONFIG.maxSavedAp);
  });

  it("save and load restores day and stats", async () => {
    const engine = new GameEngine({ seed: 99, useCuratedWeather: true });
    await engine.startGame();
    await engine.doTask("plant_crops");
    const raw = engine.save();
    const loaded = deserializeState(raw);
    expect(loaded.day).toBe(1);
    expect(loaded.completedTasks).toContain("plant_crops");

    const engine2 = new GameEngine({ seed: 1, useCuratedWeather: true });
    const result = engine2.load(serializeState(loaded));
    expect(result.ok).toBe(true);
    expect(engine2.getView().day).toBe(1);
    expect(engine2.getView().stats.hunger.current).toBe(
      loaded.stats.hunger.current,
    );
  });

  it("triggers hazard phase on day 3", async () => {
    const engine = new GameEngine({ seed: 55, useCuratedWeather: true });
    await engine.startGame();

    await engine.sleep();
    let view = engine.getView();
    if (view.phase === "hazard") engine.acknowledgeHazard();
    await engine.sleep();
    view = engine.getView();
    expect(view.day).toBe(3);
    expect(view.phase).toBe("hazard");
    expect(view.activeHazard).not.toBeNull();
  });
});

describe("Boss endings", () => {
  it("picks the strongest qualifying stat", () => {
    const stats = createStartingStats();
    stats.shield.current = 52;
    stats.hunger.current = 60;
    expect(resolveBoss(stats).ending).toBe("food");
  });

  it("uses plan tie-break when values match", () => {
    const stats = createStartingStats();
    stats.shield.current = 50;
    stats.hunger.current = 50;
    expect(resolveBoss(stats).ending).toBe("shield");
  });

  it("picks food ending when only hunger qualifies", () => {
    const stats = createStartingStats();
    stats.hunger.current = 50;
    expect(resolveBoss(stats).ending).toBe("food");
  });

  it("picks power ending when only power qualifies", () => {
    const stats = createStartingStats();
    stats.power.current = 50;
    expect(resolveBoss(stats).ending).toBe("power");
  });

  it("picks health ending when only health qualifies", () => {
    const stats = createStartingStats();
    stats.health.current = 50;
    expect(resolveBoss(stats).ending).toBe("health");
  });

  it("picks bad ending when nothing reaches threshold", () => {
    const stats = createStartingStats();
    expect(resolveBoss(stats).ending).toBe("bad");
  });
});

describe("NASA curated data", () => {
  it("returns attributed curated weather with severity", () => {
    const snap = getCuratedSpaceWeather(0);
    expect(snap.source).toBe("curated");
    expect(snap.attribution).toMatch(/DONKI/);
    expect(snap.severityMultiplier).toBeGreaterThanOrEqual(1);
    expect(snap.events.length).toBeGreaterThan(0);
  });
});

describe("full playthrough", () => {
  it("balanced build can reach a non-game-over ending", async () => {
    const engine = new GameEngine({ seed: 2026, useCuratedWeather: true });
    await engine.startGame();
    const order = [
      "plant_crops",
      "install_solar",
      "reinforce_habitat",
      "repair_oxygen",
      "expand_greenhouse",
      "upgrade_batteries",
      "build_radiation_shelter",
      "repair_water",
      "medic_room",
      "patch_shield",
    ];

    for (let i = 0; i < 250; i += 1) {
      const view = engine.getView();
      if (view.ending) break;
      if (view.phase === "hazard") {
        engine.acknowledgeHazard();
        continue;
      }
      if (view.phase === "acting") {
        let acted = false;
        for (const id of order) {
          const latest = engine.getView();
          const task = latest.availableTasks.find((t) => t.id === id);
          if (task && latest.ap >= task.apCost) {
            await engine.doTask(id);
            acted = true;
            break;
          }
        }
        if (!acted) await engine.sleep();
      }
    }

    const ending = engine.getView().ending;
    expect(ending).not.toBeNull();
    expect(ending).not.toBe("game_over");
  });
});
