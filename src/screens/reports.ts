// Morning and night screens: daily report, warning, hazard scene, sleep summary.

import { FACILITY_IDS, RESOURCE_IDS } from '../contract/types';
import { hazardAssetId } from '../content/assetManifest';
import {
  BOSS_WARNING_TEXT,
  FACILITY_NAMES,
  GENERIC_HAZARD_HINT,
  HAZARD_HINTS,
  STATUS_LABELS,
  explainHazard,
  healthReasonText,
} from '../content/dialogue';
import { filterEvents, findEvent } from '../flow/events';
import type { FlowContext } from '../flow/flow';
import { assetBox } from './assets';
import { changeList, dialogueBox, panel, resourceChip, screen } from './common';
import { button, h } from './dom';

export function dailyReportScreen(ctx: FlowContext): HTMLElement {
  const s = ctx.state;
  const started = findEvent(ctx.morningEvents, 'dayStarted');
  const random = findEvent(ctx.morningEvents, 'randomEvent');
  const problems = s ? FACILITY_IDS.filter((id) => s.facilities[id].status === 'damaged' || s.facilities[id].status === 'unpowered') : [];

  return screen(
    'report',
    panel(
      `Day ${s?.day ?? '?'} Report`,
      [
        started &&
          h('p', {
            text:
              `AP today: ${started.apTotal} (+${started.apGranted})` +
              (started.apLostToCap > 0 ? `. Lost ${started.apLostToCap} (max ${s?.apCap}).` : '.'),
          }),
        random
          ? h(
              'div',
              { class: `report-event ${random.positive ? 'good' : 'bad'}` },
              h('h3', { text: random.name }),
              h('p', { text: random.message }),
              changeList(random.changes),
            )
          : h('p', { class: 'muted', text: 'Quiet night.' }),
        s &&
          h(
            'div',
            {},
            h('h3', { text: 'Supplies' }),
            h(
              'ul',
              { class: 'supply-list' },
              ...RESOURCE_IDS.map((r) =>
                h('li', {}, resourceChip(r, `${s.resources[r].current} / ${s.resources[r].max}`)),
              ),
            ),
          ),
        problems.length > 0 &&
          s &&
          h(
            'div',
            {},
            h('h3', { text: 'Broken' }),
            h('ul', {}, ...problems.map((id) => h('li', { text: `${FACILITY_NAMES[id]}: ${STATUS_LABELS[s.facilities[id].status]}` }))),
          ),
      ],
      [button('OK', ctx.actions.next)],
    ),
  );
}

export function warningScreen(ctx: FlowContext): HTMLElement {
  const w = findEvent(ctx.morningEvents, 'warning');
  if (!w) return screen('warning', panel('Warning', [h('p', { text: 'No warning.' })], [button('OK', ctx.actions.next)]));

  if (w.kind === 'boss') {
    return screen(
      'warning',
      panel(
        'Alien Tomorrow!',
        [assetBox('char_alien_boss', { class: 'warning-image' }), h('p', { text: BOSS_WARNING_TEXT })],
        [button('Got it', ctx.actions.next)],
      ),
    );
  }

  const hint = w.hint ?? (w.hazardId ? HAZARD_HINTS[w.hazardId] : undefined) ?? GENERIC_HAZARD_HINT;
  // Warning days are the day *before* the hazard night (e.g. Day 2 warns for Night 3).
  const when = w.day === (ctx.state?.day ?? 0) ? 'tonight' : 'tomorrow night';
  return screen(
    'warning',
    panel(
      `${w.hazardName ?? 'Hazard'} ${when}!`,
      [
        w.hazardId && assetBox(hazardAssetId(w.hazardId), { class: 'warning-image' }),
        h('p', { text: `Coming ${when}. Get ready!` }),
        dialogueBox('jamie', hint, []),
      ],
      [button('Got it', ctx.actions.next)],
    ),
  );
}

export function hazardSceneScreen(ctx: FlowContext): HTMLElement {
  const hz = findEvent(ctx.nightEvents, 'hazardStruck');
  if (!hz) return screen('hazard', panel('Hazard', [], [button('Continue', ctx.actions.next)]));
  const lines = explainHazard(hz);
  return screen(
    'hazard',
    h(
      'div',
      { class: 'cutscene' },
      assetBox(hazardAssetId(hz.hazardId), { class: 'cutscene-image' }),
      h('h2', { text: `${hz.name}!` }),
      h('p', { class: 'cutscene-text', text: hz.description }),
      dialogueBox('jamie', lines.join(' '), []),
      h('div', { class: 'panel-actions' }, button('Continue', ctx.actions.next)),
    ),
  );
}

export function sleepSummaryScreen(ctx: FlowContext): HTMLElement {
  const ev = ctx.nightEvents;
  const hz = findEvent(ev, 'hazardStruck');
  const consumption = findEvent(ev, 'consumption');
  const production = findEvent(ev, 'production');
  const shortage = findEvent(ev, 'powerShortage');
  const statusChanges = filterEvents(ev, 'facilityStatusChanged');
  const crops = findEvent(ev, 'cropsReady');
  const health = findEvent(ev, 'healthChanged');
  const dead = findEvent(ev, 'gameOver');

  return screen(
    'summary',
    panel(
      `Night ${ctx.state?.day ?? '?'}`,
      [
        hz &&
          h(
            'div',
            { class: 'report-event bad' },
            h('h3', { text: hz.name }),
            h(
              'ul',
              { class: 'chip-row' },
              ...hz.damage.map((d) =>
                h(
                  'li',
                  {},
                  resourceChip(d.resource, `−${d.final}`, {
                    tone: 'down',
                    suffix: d.base > d.final ? `saved ${d.base - d.final}` : undefined,
                  }),
                ),
              ),
            ),
          ),
        consumption && h('div', {}, h('h3', { text: 'Used' }), changeList(consumption.changes)),
        production && h('div', {}, h('h3', { text: 'Made' }), changeList(production.changes) ?? h('p', { class: 'muted', text: 'Nothing made.' })),
        crops &&
          h('p', { class: 'change up chip-row' }, h('span', { text: 'Harvest' }), resourceChip('food', `+${crops.amount}`, { tone: 'up' })),
        shortage &&
          h('p', {
            class: 'report-event bad',
            text: `Not enough Power. Off: ${shortage.facilitiesOff.map((f) => FACILITY_NAMES[f]).join(', ')}.`,
          }),
        statusChanges.length > 0 &&
          h('ul', {}, ...statusChanges.map((c) => h('li', { text: `${FACILITY_NAMES[c.facility]}: ${STATUS_LABELS[c.from]} → ${STATUS_LABELS[c.to]}` }))),
        health &&
          h(
            'div',
            { class: `report-event ${health.delta >= 0 ? 'good' : 'bad'}` },
            h('h3', { text: `Health ${health.delta >= 0 ? '+' : ''}${health.delta}` }),
            h('p', { text: healthReasonText(health) }),
          ),
        dead && h('p', { class: 'report-event bad', text: 'Health ran out...' }),
      ],
      [button(dead ? 'Continue' : 'Wake up', ctx.actions.afterNight)],
    ),
  );
}
