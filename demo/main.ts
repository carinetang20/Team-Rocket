import { GameEngine } from "../src/index";
import type { PublicView, StatId } from "../src/index";

const SAVE_KEY = "teamrocket-demo-save";
const NASA_KEY_STORAGE = "teamrocket-nasa-key";

const bootScreen = el<HTMLElement>("boot-screen");
const gameScreen = el<HTMLElement>("game-screen");
const weatherMode = el<HTMLSelectElement>("weather-mode");
const apiKeyField = el<HTMLElement>("api-key-field");
const nasaKeyInput = el<HTMLInputElement>("nasa-key");
const btnStart = el<HTMLButtonElement>("btn-start");
const btnSave = el<HTMLButtonElement>("btn-save");
const btnLoad = el<HTMLButtonElement>("btn-load");
const btnSleep = el<HTMLButtonElement>("btn-sleep");
const btnHazard = el<HTMLButtonElement>("btn-hazard");
const btnRestart = el<HTMLButtonElement>("btn-restart");
const solLabel = el<HTMLElement>("sol-label");
const phaseLabel = el<HTMLElement>("phase-label");
const apLabel = el<HTMLElement>("ap-label");
const statRow = el<HTMLElement>("stat-row");
const reportText = el<HTMLElement>("report-text");
const weatherText = el<HTMLElement>("weather-text");
const weatherAttr = el<HTMLElement>("weather-attr");
const taskList = el<HTMLElement>("task-list");
const logList = el<HTMLElement>("log-list");
const endingBox = el<HTMLElement>("ending-box");
const endingTitle = el<HTMLElement>("ending-title");
const endingBlurb = el<HTMLElement>("ending-blurb");

let engine: GameEngine | null = null;
let busy = false;

const STAT_LABELS: Record<StatId, string> = {
  hunger: "Food",
  power: "Power",
  shield: "Shield",
  health: "Health",
};

nasaKeyInput.value = sessionStorage.getItem(NASA_KEY_STORAGE) ?? "";

weatherMode.addEventListener("change", () => {
  apiKeyField.hidden = weatherMode.value !== "live";
});

btnStart.addEventListener("click", () => void startMission());
btnRestart.addEventListener("click", () => void startMission());
btnSleep.addEventListener("click", () => void run(() => engine!.sleep()));
btnHazard.addEventListener("click", () => {
  if (!engine) return;
  engine.acknowledgeHazard();
  render();
});
btnSave.addEventListener("click", () => {
  if (!engine) return;
  localStorage.setItem(SAVE_KEY, engine.save());
  flashReport("Progress saved on this device.");
});
btnLoad.addEventListener("click", () => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    flashReport("No save found yet.");
    return;
  }
  if (!engine) {
    engine = new GameEngine({ useCuratedWeather: true });
  }
  const result = engine.load(raw);
  if (!result.ok) {
    flashReport(result.reason ?? "Could not load save.");
    return;
  }
  bootScreen.hidden = true;
  gameScreen.hidden = false;
  btnSave.disabled = false;
  render();
});

async function startMission(): Promise<void> {
  const useCurated = weatherMode.value !== "live";
  const apiKey = nasaKeyInput.value.trim() || undefined;
  if (apiKey) sessionStorage.setItem(NASA_KEY_STORAGE, apiKey);

  engine = new GameEngine({
    seed: Date.now(),
    useCuratedWeather: useCurated,
    nasaApiKey: apiKey,
  });

  bootScreen.hidden = true;
  gameScreen.hidden = false;
  endingBox.hidden = true;
  btnSave.disabled = false;

  await run(() => engine!.startGame());
}

async function run(action: () => Promise<unknown> | unknown): Promise<void> {
  if (!engine || busy) return;
  busy = true;
  setControlsEnabled(false);
  try {
    await action();
  } finally {
    busy = false;
    render();
  }
}

function render(): void {
  if (!engine) return;
  const view = engine.getView();

  solLabel.textContent = `Sol ${view.day} / ${view.maxDays}`;
  phaseLabel.textContent = prettyPhase(view);
  apLabel.textContent = `AP ${view.ap} / ${view.apCap}`;

  renderStats(view);
  renderReport(view);
  renderWeather(view);
  renderTasks(view);
  renderLog(view);
  renderEnding(view);

  btnSleep.disabled = !view.canSleep || Boolean(view.ending) || busy;
  btnHazard.hidden = view.phase !== "hazard" || Boolean(view.ending);
  setControlsEnabled(!busy && !view.ending);
  if (view.ending) {
    btnSleep.disabled = true;
    btnHazard.hidden = true;
  }
}

function renderStats(view: PublicView): void {
  const ids = Object.keys(STAT_LABELS) as StatId[];
  statRow.innerHTML = ids
    .map((id) => {
      const s = view.stats[id];
      const pct = Math.round((s.current / Math.max(1, s.max)) * 100);
      const low = s.current < 5 ? " low" : "";
      return `
        <div class="stat">
          <p class="stat-name">${STAT_LABELS[id]}</p>
          <p class="stat-value">${s.current} / ${s.max}</p>
          <div class="bar${low}"><span style="width:${pct}%"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderReport(view: PublicView): void {
  if (view.ending) {
    reportText.textContent = view.endingBlurb ?? "Mission complete.";
    return;
  }
  if (view.phase === "hazard" && view.activeHazard) {
    reportText.textContent = `Hazard in progress: ${view.activeHazard.replaceAll("_", " ")}. Tap continue, then keep working or sleep.`;
    return;
  }
  if (view.lastReport) {
    const bits = [...view.lastReport.randomEventMessages];
    if (view.warnedHazard) {
      bits.push(`Tomorrow’s warning: ${view.warnedHazard.replaceAll("_", " ")}`);
    }
    reportText.textContent = bits.length
      ? bits.join(" ")
      : "Quiet morning. Plan your three actions carefully.";
    return;
  }
  reportText.textContent = "Waiting for sunrise…";
}

function renderWeather(view: PublicView): void {
  const w = view.spaceWeather;
  if (!w) {
    weatherText.textContent = "No weather data yet.";
    weatherAttr.textContent = "";
    return;
  }
  const tag = w.source === "live" ? "LIVE" : "CURATED";
  weatherText.textContent = `[${tag}] ${w.summary}`;
  weatherAttr.textContent = w.attribution;
}

function renderTasks(view: PublicView): void {
  if (view.ending) {
    taskList.innerHTML = `<p class="tip">Mission ended — check the ending panel.</p>`;
    return;
  }
  if (view.phase === "hazard") {
    taskList.innerHTML = `<p class="tip">Finish the hazard cutscene first.</p>`;
    return;
  }

  taskList.innerHTML = view.availableTasks
    .map((task) => {
      const can = view.canAct && view.ap >= task.apCost && !busy;
      return `
        <button type="button" class="task" data-task="${task.id}" ${can ? "" : "disabled"}>
          <span>
            <strong>${task.name}</strong>
            <p class="desc">${task.description}</p>
            <p class="tip">${task.kidTip}</p>
          </span>
          <span class="cost">${task.apCost} AP</span>
        </button>
      `;
    })
    .join("");

  taskList.querySelectorAll<HTMLButtonElement>("[data-task]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.task;
      if (!id) return;
      void run(() => engine!.doTask(id));
    });
  });
}

function renderLog(view: PublicView): void {
  logList.innerHTML = view.logTail
    .slice()
    .reverse()
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
}

function renderEnding(view: PublicView): void {
  if (!view.ending) {
    endingBox.hidden = true;
    return;
  }
  endingBox.hidden = false;
  endingTitle.textContent =
    view.ending === "game_over"
      ? "Mission failed"
      : view.ending === "bad"
        ? "Bad ending"
        : `${capitalize(view.ending)} ending`;
  endingBlurb.textContent = view.endingBlurb ?? "";
}

function setControlsEnabled(enabled: boolean): void {
  taskList.querySelectorAll("button").forEach((btn) => {
    if (!enabled) btn.setAttribute("disabled", "true");
  });
}

function flashReport(message: string): void {
  reportText.textContent = message;
}

function prettyPhase(view: PublicView): string {
  if (view.ending) return "Ended";
  if (view.phase === "hazard") return "Hazard";
  if (view.phase === "acting") return "Day loop";
  return view.phase;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

