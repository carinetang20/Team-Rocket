import { resolveBoss, endingBlurbFor } from "./boss.js";
import { CONFIG } from "./config.js";
import { RANDOM_EVENTS, RANDOM_EVENT_IDS } from "./events.js";
import { HAZARDS, HAZARD_IDS, isHazardDay } from "./hazards.js";
import { createRng, pickOne } from "./rng.js";
import { deserializeState, serializeState } from "./save.js";
import { resolveSleep } from "./sleep.js";
import { createInitialState, pushLog } from "./state.js";
import { isDead, deathReason } from "./stats.js";
import { applyTaskEffects, listAvailableTasks, TASKS } from "./tasks.js";
import { getCuratedSpaceWeather } from "../data/nasa/curated.js";
import { fetchSpaceWeather } from "../data/nasa/donki.js";
import type {
  ActionResult,
  GameState,
  HazardId,
  PublicView,
  RandomEventId,
  SpaceWeatherSnapshot,
} from "./types.js";

export interface EngineOptions {
  seed?: number;
  /** Prefer curated NASA data (offline / tests). Default true for reliability. */
  useCuratedWeather?: boolean;
  nasaApiKey?: string;
}

/**
 * Person A public API — Person B calls these from UI clicks.
 * Pure game logic; no DOM.
 */
export class GameEngine {
  private state: GameState;
  private rng: () => number;
  private useCuratedWeather: boolean;
  private nasaApiKey?: string;

  constructor(options: EngineOptions = {}) {
    const seed = options.seed ?? Date.now();
    this.state = createInitialState(seed);
    this.rng = createRng(seed);
    this.useCuratedWeather = options.useCuratedWeather ?? true;
    this.nasaApiKey = options.nasaApiKey;
  }

  /** Switch between curated samples and live DONKI mid-session. */
  setWeatherMode(useCurated: boolean, apiKey?: string): void {
    this.useCuratedWeather = useCurated;
    if (apiKey !== undefined) this.nasaApiKey = apiKey;
  }

  getState(): GameState {
    return structuredClone(this.state);
  }

  getView(): PublicView {
    const s = this.state;
    return {
      phase: s.phase,
      day: s.day,
      maxDays: s.maxDays,
      ap: s.ap,
      apCap: s.apCap,
      stats: structuredClone(s.stats),
      availableTasks: listAvailableTasks(s),
      lastReport: s.lastReport ? structuredClone(s.lastReport) : null,
      activeHazard: s.activeHazard,
      warnedHazard: s.warnedHazard,
      ending: s.ending,
      endingBlurb: endingBlurbFor(s),
      canSleep: s.phase === "acting" || s.phase === "hazard",
      canAct: s.phase === "acting" && s.ap > 0 && !s.ending,
      spaceWeather: s.spaceWeather ? structuredClone(s.spaceWeather) : null,
      logTail: s.log.slice(-12),
    };
  }

  /** Begin mission after intro cutscene (Person B triggers this). */
  async startGame(): Promise<ActionResult> {
    if (this.state.phase !== "boot" && this.state.phase !== "ended") {
      return fail(this.state, "Game already in progress.");
    }
    this.state = createInitialState(this.state.seed);
    this.rng = createRng(this.state.seed);
    this.state.spaceWeather = await this.loadWeather(0);
    pushLog(this.state, [
      "Alien boss destroyed the outpost. Earth sent you to help rebuild.",
      "Commander Jasslyn welcomes you. Survive 15 sols.",
      this.state.spaceWeather.summary,
    ]);
    return this.beginDay(1);
  }

  /** Spend AP on a task. */
  async doTask(taskId: string): Promise<ActionResult> {
    if (this.state.phase !== "acting") {
      return fail(this.state, "You can only do tasks during the day.");
    }
    if (this.state.ending) {
      return fail(this.state, "Mission already ended.");
    }

    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return fail(this.state, `Unknown task: ${taskId}`);

    const available = listAvailableTasks(this.state);
    if (!available.some((t) => t.id === taskId)) {
      return fail(this.state, "That task is not available.");
    }
    if (this.state.ap < task.apCost) {
      return fail(this.state, `Need ${task.apCost} AP (you have ${this.state.ap}).`);
    }

    this.state.ap -= task.apCost;
    const meowth = {
      hunger: this.state.meowthHunger,
      claimed: this.state.meowthRewardClaimed,
    };
    const messages = [
      `Task: ${task.name} (−${task.apCost} AP)`,
      ...applyTaskEffects(
        task,
        this.state.stats,
        this.state.production,
        this.state.flags,
        meowth,
      ),
    ];
    this.state.meowthHunger = meowth.hunger;
    this.state.meowthRewardClaimed = meowth.claimed;

    if (task.once) {
      this.state.completedTasks.push(task.id);
    }

    pushLog(this.state, messages);

    if (isDead(this.state.stats)) {
      return this.endGameOver(deathReason(this.state.stats));
    }

    if (this.state.ap <= 0) {
      pushLog(this.state, ["Action points spent. Time to sleep."]);
      return this.sleep();
    }

    return ok(this.state, messages);
  }

  /** End the day early (or when AP hits 0). */
  async sleep(): Promise<ActionResult> {
    if (this.state.phase !== "acting" && this.state.phase !== "hazard") {
      return fail(this.state, "Cannot sleep right now.");
    }
    if (this.state.ending) {
      return fail(this.state, "Mission already ended.");
    }

    const sleep = resolveSleep(this.state);
    pushLog(this.state, sleep.messages);

    if (sleep.gameOver) {
      return this.endGameOver(sleep.gameOverReason ?? "Mission failed.");
    }

    const nextDay = this.state.day + 1;
    if (nextDay > this.state.maxDays) {
      return this.triggerBoss();
    }
    if (nextDay === CONFIG.bossDay) {
      this.state.day = nextDay;
      return this.triggerBoss();
    }

    return this.beginDay(nextDay);
  }

  /** Acknowledge hazard cutscene so player can keep acting / sleep. */
  acknowledgeHazard(): ActionResult {
    if (this.state.phase !== "hazard") {
      return fail(this.state, "No hazard to acknowledge.");
    }
    this.state.phase = "acting";
    this.state.activeHazard = null;
    pushLog(this.state, ["Hazard sequence finished. Choose tasks or sleep."]);
    return ok(this.state, ["Hazard acknowledged."]);
  }

  save(): string {
    return serializeState(this.state);
  }

  load(raw: string): ActionResult {
    try {
      this.state = deserializeState(raw);
      this.rng = createRng(this.state.seed ^ (this.state.day * 9973));
      pushLog(this.state, ["Game loaded."]);
      return ok(this.state, ["Game loaded."]);
    } catch (err) {
      return fail(this.state, err instanceof Error ? err.message : "Load failed.");
    }
  }

  // --- internals ---

  private async beginDay(day: number): Promise<ActionResult> {
    this.state.day = day;
    this.state.activeHazard = null;
    this.state.hazardApplied = false;

    const grant = CONFIG.dailyApGrant;
    this.state.ap = Math.min(CONFIG.maxSavedAp, this.state.ap + grant);

    // Refresh NASA weather on day 1 and every hazard sol so radiation scaling stays current.
    if (day === 1 || isHazardDay(day) || !this.state.spaceWeather) {
      this.state.spaceWeather = await this.loadWeather(day);
    }
    const weather = this.state.spaceWeather;

    const messages: string[] = [`=== Sol ${day} begins ===`, `AP now ${this.state.ap}.`];
    if (isHazardDay(day)) {
      messages.push(`Space weather: ${weather.summary}`);
    }

    let randomEventId: RandomEventId | null = null;
    const randomEventMessages: string[] = [];
    if (day >= 2) {
      randomEventId = pickOne(this.rng, RANDOM_EVENT_IDS);
      const event = RANDOM_EVENTS[randomEventId];
      randomEventMessages.push(`Daily report: ${event.name}`, event.description);
      randomEventMessages.push(
        ...event.apply(this.state.stats, this.state.production, this.state.flags),
      );
      messages.push(...randomEventMessages);
    } else {
      messages.push(
        "Tutorial morning — Commander Jasslyn briefs you. No random crisis today.",
      );
    }

    let upcoming: HazardId | null = null;
    if (isHazardDay(day + 1)) {
      upcoming = this.pickHazard(day + 1);
      this.state.warnedHazard = upcoming;
      messages.push(
        `Warning: ${HAZARDS[upcoming].name} expected tomorrow! Prepare your systems.`,
      );
    } else if (!isHazardDay(day)) {
      this.state.warnedHazard = null;
    }

    this.state.lastReport = {
      day,
      randomEvent: randomEventId,
      randomEventMessages,
      upcomingHazard: upcoming,
      spaceWeather: weather,
    };

    if (isDead(this.state.stats)) {
      pushLog(this.state, messages);
      return this.endGameOver(deathReason(this.state.stats));
    }

    if (isHazardDay(day)) {
      const hazardId = this.state.warnedHazard ?? this.pickHazard(day);
      this.state.warnedHazard = null;
      this.state.activeHazard = hazardId;
      this.state.hazardHistory.push(hazardId);
      this.state.phase = "hazard";
      const hazardMsgs = this.applyActiveHazard();
      messages.push(...hazardMsgs);
      pushLog(this.state, messages);

      if (isDead(this.state.stats)) {
        return this.endGameOver(deathReason(this.state.stats));
      }
      return ok(this.state, messages);
    }

    this.state.phase = "acting";
    pushLog(this.state, messages);
    return ok(this.state, messages);
  }

  private applyActiveHazard(): string[] {
    const id = this.state.activeHazard;
    if (!id || this.state.hazardApplied) return [];
    const hazard = HAZARDS[id];
    const mult = this.state.spaceWeather?.severityMultiplier ?? 1;
    const msgs = [
      `HAZARD on Sol ${this.state.day}: ${hazard.name}`,
      hazard.description,
      ...hazard.apply(
        this.state.stats,
        this.state.production,
        this.state.flags,
        mult,
      ),
    ];
    this.state.hazardApplied = true;
    return msgs;
  }

  private pickHazard(day: number): HazardId {
    const pool =
      day >= 9
        ? HAZARD_IDS
        : HAZARD_IDS.filter((id) => id !== "alien_invasion" || day >= 6);
    const last = this.state.hazardHistory[this.state.hazardHistory.length - 1];
    const filtered = pool.filter((id) => id !== last);
    return pickOne(this.rng, filtered.length ? filtered : pool);
  }

  private triggerBoss(): ActionResult {
    this.state.phase = "boss";
    this.state.day = CONFIG.bossDay;
    const result = resolveBoss(this.state.stats);
    this.state.ending = result.ending;
    this.state.phase = "ended";
    const messages = [
      "=== Sol 15: The alien boss returns! ===",
      ...result.messages,
      result.blurb,
    ];
    pushLog(this.state, messages);
    return ok(this.state, messages);
  }

  private endGameOver(reason: string): ActionResult {
    this.state.ending = "game_over";
    this.state.phase = "ended";
    pushLog(this.state, [reason, "Game over."]);
    return ok(this.state, [reason, "Game over."]);
  }

  private async loadWeather(dayIndex: number): Promise<SpaceWeatherSnapshot> {
    if (this.useCuratedWeather) {
      return getCuratedSpaceWeather(dayIndex);
    }
    return fetchSpaceWeather({ apiKey: this.nasaApiKey });
  }
}

function ok(state: GameState, messages: string[]): ActionResult {
  return { ok: true, messages, state: structuredClone(state) };
}

function fail(state: GameState, reason: string): ActionResult {
  return {
    ok: false,
    reason,
    messages: [reason],
    state: structuredClone(state),
  };
}
