// Gameplay flow — owned by Person B.
// Decides which screen is shown and when, and connects screens to the engine.
// The order of screens follows docs/screen-flow.md.

import type { EngineRules, GameEngine } from '../contract/engine';
import type {
  EngineEvent,
  EventOf,
  GameState,
  ResourceChange,
  Strategy,
  TaskId,
  TaskView,
} from '../contract/types';
import type { Speaker } from '../content/dialogue';
import type { BuildingId } from '../content/mapLayout';
import { TUTORIAL } from '../content/dialogue';
import { findEvent } from './events';
import { clearSave, loadGame, loadProfile, saveGame, saveProfile, type Profile } from './save';
import { playMusic, playSound } from './sound';
import type { MusicId } from '../content/music';

/** Brief feedback after an action (shown once, then cleared). */
export type ToastData = {
  text?: string;
  apSpent?: number;
  changes?: ResourceChange[];
} | null;

export type ScreenId =
  | 'title'
  | 'opening'
  | 'outpost'
  | 'dailyReport'
  | 'warning'
  | 'hazardScene'
  | 'sleepSummary'
  | 'gameOver'
  | 'whatWentWrong'
  | 'chooseStrategy'
  | 'ending'
  | 'results';

/** Pop-ups shown on top of the Outpost View. */
export type Modal =
  /** Upgrades for one map building (which may cover several engine facilities). */
  | { kind: 'tasks'; building: BuildingId }
  | { kind: 'baseManagement' }
  | { kind: 'dialogue'; speaker: Exclude<Speaker, 'player'> }
  | null;

export interface FlowActions {
  newGame(): void;
  continueGame(): void;
  next(): void;
  doTask(id: TaskId): void;
  sleep(): void;
  afterNight(): void;
  chooseStrategy(strategy: Strategy): void;
  openModal(modal: Exclude<Modal, null>): void;
  closeModal(): void;
  tutorialNext(): void;
  tutorialSkip(): void;
  tryAgain(): void;
  toTitle(): void;
}

/** Everything a screen can read. Screens never call the engine directly. */
export interface FlowContext {
  readonly state: GameState | null;
  readonly rules: EngineRules;
  readonly morningEvents: EngineEvent[];
  readonly nightEvents: EngineEvent[];
  readonly bossEvent: EventOf<'bossResolved'> | null;
  readonly tasks: TaskView[];
  readonly modal: Modal;
  readonly tutorialStep: number | null;
  readonly toast: ToastData;
  readonly profile: Profile;
  readonly hasSave: boolean;
  readonly actions: FlowActions;
}

export type ScreenRenderer = (ctx: FlowContext) => HTMLElement;
export type Overlay = (flow: Flow) => HTMLElement | null;

export class Flow implements FlowContext {
  state: GameState | null = null;
  morningEvents: EngineEvent[] = [];
  nightEvents: EngineEvent[] = [];
  bossEvent: EventOf<'bossResolved'> | null = null;
  modal: Modal = null;
  tutorialStep: number | null = null;
  toast: ToastData = null;
  profile: Profile = loadProfile();
  screen: ScreenId = 'title';
  readonly actions: FlowActions;
  private queue: ScreenId[] = [];

  constructor(
    private readonly engine: GameEngine,
    private readonly screens: Record<ScreenId, ScreenRenderer>,
    private readonly root: HTMLElement,
    private readonly overlays: Overlay[] = [],
  ) {
    this.actions = {
      newGame: () => this.startNewGame(true),
      continueGame: () => this.continueGame(),
      next: () => this.next(),
      doTask: (id) => this.doTask(id),
      sleep: () => this.sleep(),
      afterNight: () => this.afterNight(),
      chooseStrategy: (s) => this.chooseStrategy(s),
      openModal: (m) => {
        playSound('open');
        this.modal = m;
        this.render();
      },
      closeModal: () => {
        playSound('close');
        this.modal = null;
        this.render();
      },
      tutorialNext: () => this.tutorialAdvance(false),
      tutorialSkip: () => this.tutorialAdvance(true),
      // Try Again skips the opening story but replays the tutorial (it has a Skip button).
      tryAgain: () => this.startNewGame(false),
      toTitle: () => this.show('title'),
    };
  }

  get rules(): EngineRules {
    return this.engine.rules;
  }

  get hasSave(): boolean {
    return loadGame() !== null;
  }

  get tasks(): TaskView[] {
    return this.state?.phase === 'playing' ? this.engine.getTasks(this.state) : [];
  }

  render(): void {
    const el = this.screens[this.screen](this);
    this.root.replaceChildren(el);
    for (const overlay of this.overlays) {
      const extra = overlay(this);
      if (extra) this.root.append(extra);
    }
    this.toast = null; // a toast is shown once
  }

  /** Queue a sequence of screens and show the first. */
  show(...screens: ScreenId[]): void {
    this.queue = screens;
    this.next();
  }

  /** Dev tools only: edit the state directly and return to the outpost. */
  debugMutate(fn: (s: GameState) => void): void {
    if (!this.state) return;
    const copy = structuredClone(this.state);
    fn(copy);
    this.state = copy;
    this.morningEvents = [];
    this.show('outpost');
  }

  private next(): void {
    this.screen = this.queue.shift() ?? 'outpost';
    this.modal = null;
    playMusic(this.musicFor(this.screen));
    this.render();
  }

  /** Background track for a screen. Endings and game over stay quiet so the win/lose jingle stands out. */
  private musicFor(screen: ScreenId): MusicId | null {
    switch (screen) {
      case 'title':
      case 'opening':
      case 'results':
        return 'title';
      case 'gameOver':
      case 'whatWentWrong':
      case 'ending':
        return null;
      case 'chooseStrategy':
        return 'boss';
      default:
        // Day 14 is the last day before the alien: switch to the tense track.
        return this.state && this.state.day >= this.rules.finalDay - 1 ? 'boss' : 'outpost';
    }
  }

  private startNewGame(withIntro: boolean): void {
    const r = this.engine.newGame();
    this.state = r.state;
    this.morningEvents = r.events;
    this.nightEvents = [];
    this.bossEvent = null;
    this.autosave();
    this.tutorialStep = 0;
    if (withIntro) this.show('opening', 'outpost');
    else this.show('outpost');
  }

  private continueGame(): void {
    const text = loadGame();
    if (!text) return;
    try {
      this.state = this.engine.deserialize(text);
    } catch {
      clearSave();
      this.toast = { text: 'Save broken. Please start a new game.' };
      this.show('title');
      return;
    }
    this.morningEvents = [];
    this.nightEvents = [];
    this.bossEvent = null;
    this.tutorialStep = null;
    // A save made on the final morning resumes straight at the boss.
    if (this.state.day >= this.rules.finalDay) this.show('chooseStrategy');
    else this.show('outpost');
  }

  private doTask(id: TaskId): void {
    if (!this.state) return;
    const before = this.state;
    const r = this.engine.doTask(this.state, id);
    this.state = r.state;
    const done = findEvent(r.events, 'taskCompleted');
    const rejected = findEvent(r.events, 'taskRejected');
    if (done) {
      // A repair that brings a building back to life gets the special "fixed" sound.
      // (Compared by state: the engine doesn't send a status event for repairs.)
      const after = r.state;
      const repaired = Object.values(before.facilities).some(
        (f) => f.status === 'damaged' && after.facilities[f.id].status !== 'damaged',
      );
      playSound(repaired ? 'fixed' : 'upgrade');
      this.toast = {
        text: done.name,
        apSpent: done.apSpent,
        changes: done.changes.filter((c) => c.delta !== 0),
      };
    } else if (rejected) {
      playSound('denied');
      this.toast = { text: rejected.reason };
    }

    // Out of AP before the final day → the day ends automatically.
    if (done && this.state.ap === 0 && this.state.day < this.rules.finalDay) {
      this.sleep();
      return;
    }
    this.modal = null;
    this.render();
  }

  private sleep(): void {
    if (!this.state) return;
    const r = this.engine.sleep(this.state);
    this.state = r.state;
    this.nightEvents = r.events;
    const hazard = findEvent(r.events, 'hazardStruck');
    const broke = r.events.some(
      (e) => e.type === 'facilityStatusChanged' && (e.to === 'damaged' || e.to === 'unpowered'),
    );
    playSound(hazard ? 'hazard' : broke ? 'breakdown' : 'sleep');
    if (hazard) this.show('hazardScene', 'sleepSummary');
    else this.show('sleepSummary');
  }

  private afterNight(): void {
    if (!this.state) return;
    if (this.state.phase === 'dead') {
      playSound('lose');
      clearSave();
      this.show('gameOver', 'whatWentWrong', 'results');
      return;
    }
    const r = this.engine.startDay(this.state);
    this.state = r.state;
    this.morningEvents = r.events;
    this.autosave();
    // Day 15 begins: the alien appears right away (decision D1).
    if (findEvent(r.events, 'bossArrived')) {
      playSound('alien');
      this.show('chooseStrategy');
      return;
    }
    playSound(findEvent(r.events, 'warning') ? 'warning' : 'morning');
    const screens: ScreenId[] = ['dailyReport'];
    if (findEvent(r.events, 'warning')) screens.push('warning');
    screens.push('outpost');
    this.show(...screens);
  }

  private chooseStrategy(strategy: Strategy): void {
    if (!this.state) return;
    const r = this.engine.chooseStrategy(this.state, strategy);
    this.state = r.state;
    this.bossEvent = findEvent(r.events, 'bossResolved') ?? null;
    playSound(this.bossEvent?.success ? 'win' : 'lose');
    if (this.bossEvent?.success && !this.profile.endingsUnlocked.includes(strategy)) {
      this.profile = { ...this.profile, endingsUnlocked: [...this.profile.endingsUnlocked, strategy] };
      saveProfile(this.profile);
    }
    clearSave();
    this.show('ending', 'results');
  }

  private tutorialAdvance(skip: boolean): void {
    if (this.tutorialStep === null) return;
    const nextStep = this.tutorialStep + 1;
    if (skip || nextStep >= TUTORIAL.length) {
      this.tutorialStep = null;
      this.profile = { ...this.profile, tutorialSeen: true };
      saveProfile(this.profile);
    } else {
      this.tutorialStep = nextStep;
    }
    this.render();
  }

  private autosave(): void {
    if (this.state) saveGame(this.engine.serialize(this.state));
  }
}
