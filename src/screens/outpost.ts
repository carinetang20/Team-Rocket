// Outpost View — the main screen. HUD, facilities, crew, and the pop-ups opened from here
// (task menu, Base Management panel, dialogue, tutorial).

import type { FacilityId, GameState, ResourceId, TaskView } from '../contract/types';
import { CORE_STAT_IDS, FACILITY_IDS } from '../contract/types';
import { facilityAssetId } from '../content/assetManifest';
import {
  FACILITY_NAMES,
  NPC_LINES,
  RESOURCE_LABELS,
  SPEAKER_NAMES,
  STATUS_LABELS,
  TUTORIAL,
  lowWarningText,
} from '../content/dialogue';
import { filterEvents } from '../flow/events';
import type { FlowContext } from '../flow/flow';
import { assetBackground, assetBox } from './assets';
import { dialogueBox, modal, screen, toast } from './common';
import { button, clickable, h } from './dom';

const CREW = ['jasslyn', 'jamie', 'cat'] as const;

export function outpostScreen(ctx: FlowContext): HTMLElement {
  const s = ctx.state;
  if (!s) return screen('outpost', h('p', { text: 'No game loaded.' }), button('Back to title', ctx.actions.toTitle));

  const lastDay = s.upcoming?.kind === 'boss';
  const warnings = filterEvents(ctx.morningEvents, 'lowResourceWarning');

  const scene = assetBackground(h('div', { class: 'scene' }), 'bg_outpost');
  for (const id of FACILITY_IDS) scene.append(facilityTile(ctx, s, id));

  const crew = h(
    'div',
    { class: 'crew' },
    ...CREW.map((sp) =>
      clickable(
        h('div', { class: 'crew-member' }, assetBox(`char_${sp}_scene`, { compact: true }), h('span', { text: SPEAKER_NAMES[sp] })),
        () => ctx.actions.openModal({ kind: 'dialogue', speaker: sp }),
        `Talk to ${SPEAKER_NAMES[sp]}`,
      ),
    ),
  );

  const footer = h(
    'footer',
    { class: 'outpost-footer' },
    h('p', {
      class: 'muted',
      text: lastDay
        ? `🚨 Last day to prepare! The alien arrives when Day ${ctx.rules.finalDay} begins. You have ${s.ap} AP left.`
        : `You have ${s.ap} AP left. Unused AP is saved for tomorrow (up to ${s.apCap}).`,
    }),
    button(lastDay ? '🌙 Sleep (the alien comes next!)' : '🌙 Sleep (end day)', ctx.actions.sleep),
  );

  return screen(
    'outpost',
    hud(ctx, s),
    warnings.length > 0 &&
      h(
        'div',
        { class: 'banner banner-warning' },
        assetBox('char_jamie_portrait', { compact: true, class: 'mini-portrait' }),
        h('div', {}, h('strong', { text: 'Jamie:' }), ...warnings.map((w) => h('p', { text: lowWarningText(w) }))),
      ),
    h('div', { class: 'outpost-main' }, scene, crew),
    footer,
    toast(ctx.toast),
    modalFor(ctx, s),
    tutorialOverlay(ctx),
  );
}

// ---------- HUD ----------

function hud(ctx: FlowContext, s: GameState): HTMLElement {
  const pips = Array.from({ length: s.apCap }, (_, i) => h('span', { class: `ap-pip ${i < s.ap ? 'full' : ''}` }));
  return h(
    'header',
    { class: 'hud' },
    h(
      'div',
      { class: 'hud-group' },
      assetBox('icon_day', { compact: true, class: 'icon' }),
      h('strong', { text: `Day ${s.day} / ${ctx.rules.finalDay}` }),
    ),
    h(
      'div',
      { class: 'hud-group', title: 'Action Points: your energy for tasks today' },
      assetBox('icon_ap', { compact: true, class: 'icon' }),
      h('span', { text: `AP ${s.ap}` }),
      h('span', { class: 'ap-pips' }, ...pips),
    ),
    h('div', { class: 'hud-stats' }, ...CORE_STAT_IDS.map((r) => statBar(ctx, s, r))),
    h('div', { class: 'hud-stats hud-life' }, statBar(ctx, s, 'oxygen'), statBar(ctx, s, 'water')),
    button('📋 Base', () => ctx.actions.openModal({ kind: 'baseManagement' }), { variant: 'secondary' }),
  );
}

function statBar(ctx: FlowContext, s: GameState, r: ResourceId): HTMLElement {
  const v = s.resources[r];
  const pct = v.max > 0 ? Math.min(100, (v.current / v.max) * 100) : 0;
  const lifeSupport = r === 'food' || r === 'water' || r === 'oxygen';
  const low = lifeSupport && v.current < ctx.rules.lifeSupportThreshold;
  return h(
    'div',
    { class: `stat ${low ? 'stat-low' : ''}`, title: `${RESOURCE_LABELS[r]}: ${v.current} of ${v.max}` },
    assetBox(`icon_${r}`, { compact: true, class: 'icon' }),
    h(
      'div',
      { class: 'stat-body' },
      h('span', { class: 'stat-label', text: `${RESOURCE_LABELS[r]} ${low ? '⚠' : ''}` }),
      h('div', { class: 'bar' }, h('div', { class: `bar-fill bar-${r}`, style: `width:${pct}%` })),
      h('span', { class: 'stat-value', text: `${v.current} / ${v.max}` }),
    ),
  );
}

// ---------- Facilities ----------

function facilityTile(ctx: FlowContext, s: GameState, id: FacilityId): HTMLElement {
  const f = s.facilities[id];
  return clickable(
    h(
      'div',
      { class: `facility status-${f.status}` },
      assetBox(facilityAssetId(id, f.status)),
      h('span', { class: 'facility-name', text: FACILITY_NAMES[id] }),
      h('span', { class: `status-chip chip-${f.status}`, text: STATUS_LABELS[f.status] }),
    ),
    () => ctx.actions.openModal({ kind: 'tasks', facility: id }),
    `${FACILITY_NAMES[id]}: ${STATUS_LABELS[f.status]}. Open tasks.`,
  );
}

// ---------- Pop-ups ----------

function modalFor(ctx: FlowContext, s: GameState): HTMLElement | null {
  const m = ctx.modal;
  if (!m) return null;
  switch (m.kind) {
    case 'tasks':
      return tasksModal(ctx, s, m.facility);
    case 'baseManagement':
      return baseManagementModal(ctx, s);
    case 'dialogue':
      return dialogueModal(ctx, m.speaker);
  }
}

function tasksModal(ctx: FlowContext, s: GameState, facility: FacilityId): HTMLElement {
  const tasks = ctx.tasks.filter((t) => t.facility === facility);
  const f = s.facilities[facility];
  return modal(
    FACILITY_NAMES[facility],
    [
      h('p', { class: 'muted', text: `Status: ${STATUS_LABELS[f.status]} · You have ${s.ap} AP` }),
      tasks.length
        ? h('div', { class: 'task-list' }, ...tasks.map((t) => taskCard(ctx, t)))
        : h('p', { text: 'No tasks here yet.' }),
    ],
    ctx.actions.closeModal,
  );
}

function taskCard(ctx: FlowContext, t: TaskView): HTMLElement {
  return h(
    'div',
    { class: `task-card ${t.available ? '' : 'locked'}` },
    h('div', { class: 'task-head' }, h('strong', { text: t.name }), h('span', { class: 'ap-cost', text: `${t.apCost} AP` })),
    h('p', { text: t.description }),
    t.maxLevel !== null && h('p', { class: 'muted small', text: `Level ${t.level} / ${t.maxLevel}` }),
    !t.available && t.lockedReason && h('p', { class: 'locked-reason', text: `🔒 ${t.lockedReason}` }),
    button('Do it', () => ctx.actions.doTask(t.id), { disabled: !t.available }),
  );
}

function baseManagementModal(ctx: FlowContext, s: GameState): HTMLElement {
  const rows = FACILITY_IDS.map((id) => {
    const f = s.facilities[id];
    const makes = Object.entries(f.producesPerDay)
      .filter(([, n]) => (n ?? 0) > 0)
      .map(([r, n]) => `+${n} ${RESOURCE_LABELS[r as ResourceId]}`)
      .join(', ');
    return h(
      'tr',
      {},
      h('td', {}, assetBox(facilityAssetId(id, f.status), { compact: true, class: 'icon' })),
      h('td', { text: FACILITY_NAMES[id] }),
      h('td', {}, h('span', { class: `status-chip chip-${f.status}`, text: STATUS_LABELS[f.status] })),
      h('td', { text: makes ? `${makes} / night` : '—' }),
      h('td', { text: f.powerUse ? `${f.powerUse} Power` : '—' }),
    );
  });
  const crops = s.crops.length
    ? h('p', { text: `🌱 ${s.crops.length} batch(es) of crops growing. Next harvest on Day ${Math.min(...s.crops.map((c) => c.readyOnDay))}.` })
    : null;
  return modal(
    'Base Management',
    [
      h(
        'table',
        { class: 'base-table' },
        h('thead', {}, h('tr', {}, ...['', 'Facility', 'Status', 'Makes', 'Uses'].map((t) => h('th', { text: t })))),
        h('tbody', {}, ...rows),
      ),
      crops,
      h('p', { class: 'muted small', text: 'Machines only make things when they are working and have power.' }),
    ],
    ctx.actions.closeModal,
  );
}

function dialogueModal(ctx: FlowContext, speaker: (typeof CREW)[number]): HTMLElement {
  const lines = NPC_LINES[speaker];
  let i = 0;
  const holder = h('div', {});
  const draw = () => {
    holder.replaceChildren(
      dialogueBox(speaker, lines[i % lines.length] ?? '', [
        lines.length > 1 &&
          button('More', () => {
            i += 1;
            draw();
          }, { variant: 'secondary' }),
        speaker === 'cat' && button('🐟 Feed (coming later)', () => undefined, { disabled: true }),
      ]),
    );
  };
  draw();
  return modal(SPEAKER_NAMES[speaker], [holder], ctx.actions.closeModal);
}

function tutorialOverlay(ctx: FlowContext): HTMLElement | null {
  if (ctx.tutorialStep === null) return null;
  const line = TUTORIAL[ctx.tutorialStep];
  if (!line) return null;
  const last = ctx.tutorialStep === TUTORIAL.length - 1;
  return h(
    'div',
    { class: 'tutorial-overlay' },
    dialogueBox(line.speaker, line.text, [
      h('span', { class: 'muted small', text: `${ctx.tutorialStep + 1} / ${TUTORIAL.length}` }),
      !last && button('Skip tutorial', ctx.actions.tutorialSkip, { variant: 'secondary' }),
      button(last ? "Let's go!" : 'Next', ctx.actions.tutorialNext),
    ]),
  );
}
