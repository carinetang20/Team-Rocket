// Outpost View — the main screen. HUD, the outpost map (clickable buildings + crew), and the
// pop-ups opened from here (upgrades, Base Management panel, dialogue, tutorial).

import type { FacilityStatus, GameState, ResourceId, TaskEffectPreview, TaskView } from '../contract/types';
import { CORE_STAT_IDS, FACILITY_IDS } from '../contract/types';
import { ASSETS, facilityThumbAssetId, mapGlowAssetId, mapLayerAssetId, taskAssetId } from '../content/assetManifest';
import {
  FACILITY_NAMES,
  NPC_LINES,
  RESOURCE_LABELS,
  SPEAKER_NAMES,
  STATUS_ICONS,
  STATUS_LABELS,
  TUTORIAL,
  lowWarningText,
  type Speaker,
} from '../content/dialogue';
import {
  MAP_BUILDINGS,
  MAP_CHARACTERS,
  MAP_SIZE,
  getBuilding,
  type BuildingId,
  type MapBuilding,
} from '../content/mapLayout';
import { filterEvents } from '../flow/events';
import type { FlowContext } from '../flow/flow';
import { assetBackground, assetBox, assetUrl } from './assets';
import { dialogueBox, modal, resourceChip, screen } from './common';
import { button, clickable, h } from './dom';
import { isSolidAt, prepareMask } from './mapHitTest';

export function outpostScreen(ctx: FlowContext): HTMLElement {
  const s = ctx.state;
  if (!s) return screen('outpost', h('p', { text: 'No game loaded.' }), button('Back to title', ctx.actions.toTitle));

  const lastDay = s.upcoming?.kind === 'boss';
  const warnings = filterEvents(ctx.morningEvents, 'lowResourceWarning');

  const footer = h(
    'footer',
    { class: 'outpost-footer' },
    h('p', {
      class: 'muted',
      text: lastDay ? `Last day · AP ${s.ap}` : `AP ${s.ap}`,
    }),
    withIcon(button(lastDay ? 'End the Day?' : 'End the Day?', ctx.actions.sleep), 'icon_sleep'),
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
    h('div', { class: 'outpost-main' }, h('div', { class: 'map-frame' }, mapScene(ctx, s))),
    footer,
    modalFor(ctx, s),
    tutorialOverlay(ctx),
  );
}

// ---------- HUD ----------

function hud(ctx: FlowContext, s: GameState): HTMLElement {
  const pips = Array.from({ length: s.apCap }, (_, i) => h('span', { class: `ap-pip ${i < s.ap ? 'full' : ''}` }));
  const daysToHazard =
    s.upcoming?.kind === 'hazard' ? Math.max(0, s.upcoming.day - s.day) : s.upcoming?.kind === 'boss' ? Math.max(0, ctx.rules.finalDay - s.day) : null;
  const hazardLabel =
    daysToHazard === null
      ? null
      : daysToHazard === 0
        ? s.upcoming?.kind === 'boss'
          ? 'Alien next!'
          : 'Hazard tonight!'
        : s.upcoming?.kind === 'boss'
          ? `Alien in ${daysToHazard} day${daysToHazard === 1 ? '' : 's'}`
          : `Hazard in ${daysToHazard} day${daysToHazard === 1 ? '' : 's'}`;

  return h(
    'header',
    { class: 'hud' },
    h(
      'div',
      { class: 'hud-panel' },
      h('div', { class: 'hud-day' }, assetBox('icon_day', { compact: true, class: 'icon hud-icon' }), h('span', { text: `DAY ${s.day}` })),
      hazardLabel &&
        h('div', { class: 'hud-hazard' }, assetBox('icon_warning', { compact: true, class: 'icon hud-icon' }), h('span', { text: hazardLabel })),
      h(
        'div',
        { class: 'hud-group', title: 'Action Points' },
        h('span', { text: `AP ${s.ap}` }),
        h('span', { class: 'ap-pips' }, ...pips),
      ),
      h('div', { class: 'hud-stats' }, ...CORE_STAT_IDS.map((r) => statBar(ctx, s, r))),
    ),
    h(
      'div',
      { class: 'hud-panel' },
      h('div', { class: 'hud-stats hud-life' }, statBar(ctx, s, 'oxygen'), statBar(ctx, s, 'water')),
    ),
    withIcon(button('Report', () => ctx.actions.openModal({ kind: 'baseManagement' }), { variant: 'secondary' }), 'icon_base_management'),
  );
}

/** Put a small icon in front of a button's text (icon + word, never icon alone). */
function withIcon(btn: HTMLButtonElement, iconId: string): HTMLButtonElement {
  btn.classList.add('btn-with-icon');
  const icon = assetBox(iconId, { compact: true, class: 'icon btn-icon' });
  icon.setAttribute('aria-hidden', 'true'); // decorative: the button's word already says it
  btn.prepend(icon);
  return btn;
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
      h('div', { class: 'bar' }, h('div', { class: `bar-fill bar-${r}`, style: `width:${pct}%` })),
      h('span', { class: 'stat-value', text: `${v.current} / ${v.max}` }),
    ),
  );
}

// ---------- Outpost map ----------
//
// Layers, back to front: empty map (background) → one full-size image per building →
// characters → name labels. Every layer covers the whole map, so clicks are handled once on
// the map and checked against each building's visible pixels (see mapHitTest.ts).

/** Worst status wins, so a shared building (Water & Oxygen) shows a problem if either machine has one. */
const STATUS_RANK: Record<FacilityStatus, number> = { operational: 0, growing: 1, unpowered: 2, damaged: 3 };

function buildingStatus(s: GameState, b: MapBuilding): FacilityStatus {
  return b.facilities
    .map((id) => s.facilities[id].status)
    .reduce((worst, st) => (STATUS_RANK[st] > STATUS_RANK[worst] ? st : worst));
}

function statusChip(status: FacilityStatus): HTMLElement {
  return h('span', { class: `status-chip chip-${status}`, text: `${STATUS_ICONS[status]} ${STATUS_LABELS[status]}` });
}

/** Map pixels → percentage of the map, so positions scale with the map. */
const pctX = (x: number): string => `${(x / MAP_SIZE.width) * 100}%`;
const pctY = (y: number): string => `${(y / MAP_SIZE.height) * 100}%`;

function mapScene(ctx: FlowContext, s: GameState): HTMLElement {
  const stage = assetBackground(h('div', { class: 'map-stage' }), 'map_ground');
  const buildings: { b: MapBuilding; src: string; parts: HTMLElement[] }[] = [];
  const labels: HTMLElement[] = [];
  const open = (id: BuildingId) => ctx.actions.openModal({ kind: 'tasks', building: id });

  let hovered: BuildingId | null = null;
  const setHover = (id: BuildingId | null) => {
    if (id === hovered) return;
    hovered = id;
    for (const x of buildings) for (const el of x.parts) el.classList.toggle('hover', x.b.id === id);
    stage.classList.toggle('pointing', id !== null);
  };

  for (const b of MAP_BUILDINGS) {
    const src = assetUrl(mapLayerAssetId(b.id));
    if (!src) continue;
    prepareMask(src);
    const status = buildingStatus(s, b);
    const img = h('img', {
      class: `map-layer map-building status-${status}`,
      attrs: { src, alt: '', 'aria-hidden': 'true', draggable: 'false' },
    });
    // Separate outline image instead of a CSS glow: a CSS glow would show through see-through
    // parts of the art (greenhouse glass).
    const glowSrc = assetUrl(mapGlowAssetId(b.id));
    const glow =
      glowSrc &&
      h('img', {
        class: `map-layer map-glow status-${status}`,
        attrs: { src: glowSrc, alt: '', 'aria-hidden': 'true', draggable: 'false' },
      });
    // The label is the keyboard/screen-reader way in; mouse and touch can also click the building itself.
    const label = h(
      'button',
      {
        class: `map-label status-${status}`,
        style: `left:${pctX(b.label.x)};top:${pctY(b.label.y)}`,
        attrs: { type: 'button', 'data-building': b.id, 'aria-label': `${b.name}: ${STATUS_LABELS[status]}. Open upgrades.` },
        onClick: () => open(b.id),
      },
      h('span', { class: 'map-label-name', text: b.name }),
      statusChip(status),
    );
    label.addEventListener('focus', () => setHover(b.id));
    label.addEventListener('blur', () => setHover(null));
    stage.append(img);
    if (glow) stage.append(glow);
    labels.push(label);
    buildings.push({ b, src, parts: glow ? [img, glow, label] : [img, label] });
  }

  const dome = shieldDome(s);
  if (dome) stage.append(dome);

  for (const c of MAP_CHARACTERS) stage.append(mapCharacter(ctx, c));
  stage.append(...labels);

  const buildingAt = (e: MouseEvent): MapBuilding | null => {
    const r = stage.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    for (let i = buildings.length - 1; i >= 0; i--) {
      const x = buildings[i]!;
      if (isSolidAt(x.src, fx, fy)) return x.b;
    }
    return null;
  };

  stage.addEventListener('pointermove', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.map-char')) return setHover(null);
    const label = target.closest<HTMLElement>('.map-label');
    setHover(label ? (label.dataset.building as BuildingId) : (buildingAt(e)?.id ?? null));
  });
  stage.addEventListener('pointerleave', () => setHover(null));
  stage.addEventListener('click', (e) => {
    // Labels and characters handle their own clicks.
    if ((e.target as HTMLElement).closest('.map-label, .map-char')) return;
    const b = buildingAt(e);
    if (b) open(b.id);
  });

  return stage;
}

/**
 * Force-field dome over the outpost. Its strength follows the Shield bar: invisible at 0,
 * fully visible when Shield is full, so kids can see their shield grow.
 */
function shieldDome(s: GameState): HTMLElement | null {
  const src = assetUrl('facility_shield_dome');
  const shield = s.resources.shield;
  if (!src || shield.max <= 0 || shield.current <= 0) return null;
  const strength = Math.min(1, shield.current / shield.max);
  return h('img', {
    class: 'map-layer map-shield-dome',
    style: `opacity:${strength.toFixed(2)}`,
    attrs: { src, alt: '', 'aria-hidden': 'true', draggable: 'false' },
  });
}

function mapCharacter(ctx: FlowContext, c: (typeof MAP_CHARACTERS)[number]): HTMLElement {
  const art = ASSETS[`char_${c.speaker}_scene`];
  const width = art ? (c.height * art.width) / art.height : c.height * 0.6;
  const el = h(
    'div',
    {
      class: `map-char map-char-${c.speaker}`,
      style: `left:${pctX(c.x)};top:${pctY(c.feetY - c.height)};width:${pctX(width)};height:${pctY(c.height)}`,
    },
    assetBox(`char_${c.speaker}_scene`, { compact: true }),
    h('span', { class: 'map-char-name', text: SPEAKER_NAMES[c.speaker] }),
  );
  const speaker = c.speaker;
  if (!c.talks || speaker === 'player') {
    // The player just stands on the map with a "You" tag; not clickable.
    el.classList.add('map-char-you');
    el.setAttribute('aria-hidden', 'true');
    return el;
  }
  return clickable(el, () => ctx.actions.openModal({ kind: 'dialogue', speaker }), `Talk to ${SPEAKER_NAMES[speaker]}`);
}

// ---------- Pop-ups ----------

function modalFor(ctx: FlowContext, s: GameState): HTMLElement | null {
  const m = ctx.modal;
  if (!m) return null;
  switch (m.kind) {
    case 'tasks':
      return tasksModal(ctx, s, m.building);
    case 'baseManagement':
      return baseManagementModal(ctx, s);
    case 'dialogue':
      return dialogueModal(ctx, m.speaker);
  }
}

function tasksModal(ctx: FlowContext, s: GameState, buildingId: BuildingId): HTMLElement {
  const b = getBuilding(buildingId);
  // A shared building gets one section per machine, each with its own status, so the player
  // can see which half (e.g. Water or Oxygen) needs fixing.
  const shared = b.facilities.length > 1;
  const sections = b.facilities.map((facility) => {
    const tasks = ctx.tasks.filter((t) => t.facility === facility);
    return h(
      'section',
      { class: 'task-section' },
      shared &&
        h('h3', { class: 'task-section-title' }, h('span', { text: FACILITY_NAMES[facility] }), statusChip(s.facilities[facility].status)),
      tasks.length
        ? h('div', { class: 'task-list' }, ...tasks.map((t) => taskCard(ctx, t)))
        : h('p', { text: 'No tasks here yet.' }),
    );
  });
  return modal(
    b.name,
    [
      h('p', { class: 'building-blurb', text: b.blurb }),
      h('p', { class: 'task-modal-prompt', text: 'Choose your upgrades:' }),
      ...sections,
      // Shared bottom placeholder for the Do it action (per-card button sits in each card slot too).
      h('div', { class: 'task-modal-footer-slot', attrs: { 'data-placeholder': 'do-it-area' } }),
    ],
    ctx.actions.closeModal,
    { class: 'modal-upgrades' },
  );
}

function effectTone(e: TaskEffectPreview): 'up' | 'down' | 'info' {
  if (e.kind === 'info') return 'info';
  return e.delta >= 0 ? 'up' : 'down';
}

function effectChip(e: TaskEffectPreview): HTMLElement {
  if (e.kind === 'info' || !e.resource) {
    return h('li', { class: 'task-effect task-effect-info', text: e.note ?? '' });
  }
  const tone = effectTone(e);
  const signed = `${e.delta > 0 ? '+' : ''}${e.delta}`;
  const suffix =
    e.kind === 'max' ? 'max' : e.kind === 'perDay' ? '/night' : e.kind === 'delayed' ? `in ${e.readyInDays ?? '?'}d` : undefined;
  return h(
    'li',
    { class: `task-effect task-effect-${tone}` },
    resourceChip(e.resource, signed, { tone: tone === 'info' ? 'neutral' : tone, suffix }),
  );
}

function taskCard(ctx: FlowContext, t: TaskView): HTMLElement {
  return h(
    'div',
    { class: `task-card ${t.available ? 'available' : 'locked'}` },
    h(
      'span',
      { class: 'ap-cost', title: 'Action Points' },
      h('span', { text: `${t.apCost} AP` }),
    ),
    h('div', { class: 'task-card-art' }, assetBox(taskAssetId(t.id), { class: 'task-art' })),
    h('p', { class: 'task-card-name', text: t.name }),
    h('p', { class: 'task-card-desc', text: t.description }),
    t.effects.length > 0 &&
      h('ul', { class: 'task-effects', attrs: { 'aria-label': 'What this changes' } }, ...t.effects.map(effectChip)),
    t.maxLevel !== null && h('p', { class: 'muted small', text: `Lv ${t.level}/${t.maxLevel}` }),
    !t.available &&
      t.lockedReason &&
      h('p', { class: 'locked-reason' }, assetBox('icon_lock', { compact: true, class: 'icon' }), h('span', { text: t.lockedReason })),
    h(
      'div',
      { class: 'task-card-action-slot', attrs: { 'data-placeholder': 'do-it-button' } },
      button('Upgrade', () => ctx.actions.doTask(t.id), { disabled: !t.available }),
    ),
  );
}

function baseManagementModal(ctx: FlowContext, s: GameState): HTMLElement {
  const rows = FACILITY_IDS.map((id) => {
    const f = s.facilities[id];
    const makes = Object.entries(f.producesPerDay)
      .filter(([, n]) => (n ?? 0) > 0)
      .map(([r, n]) => resourceChip(r as ResourceId, `+${n}`, { tone: 'up', suffix: '/night' }));
    return h(
      'tr',
      {},
      h('td', {}, assetBox(facilityThumbAssetId(id), { compact: true, class: `icon map-thumb status-${f.status}` })),
      h('td', { text: FACILITY_NAMES[id] }),
      h('td', {}, statusChip(f.status)),
      h('td', {}, makes.length ? h('div', { class: 'chip-row' }, ...makes) : h('span', { text: '—' })),
      h('td', {}, f.powerUse ? resourceChip('power', `−${f.powerUse}`, { tone: 'down' }) : h('span', { text: '—' })),
    );
  });
  const crops = s.crops.length
    ? h('p', { text: `Crops growing. Ready Day ${Math.min(...s.crops.map((c) => c.readyOnDay))}.` })
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
      h('p', { class: 'muted small', text: 'Broken or unpowered machines make nothing.' }),
    ],
    ctx.actions.closeModal,
  );
}

function dialogueModal(ctx: FlowContext, speaker: Exclude<Speaker, 'player'>): HTMLElement {
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
      !last && button('Skip', ctx.actions.tutorialSkip, { variant: 'secondary' }),
      button(last ? 'Go!' : 'Next', ctx.actions.tutorialNext),
    ]),
  );
}
