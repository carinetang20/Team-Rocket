// Shared placeholder building blocks used by several screens.
// Person C will replace these with real UI components in src/ui/.

import type { ResourceChange, ResourceId } from '../contract/types';
import { RESOURCE_LABELS, SPEAKER_NAMES, type Speaker } from '../content/dialogue';
import { assetBox } from './assets';
import { h, type Child } from './dom';

export function screen(name: string, ...children: Child[]): HTMLElement {
  return h('div', { class: `screen screen-${name}` }, ...children);
}

/** A centred card with a title, body and buttons — used by most pop-up style screens. */
export function panel(title: string, body: Child[], actions: Child[]): HTMLElement {
  return h(
    'section',
    { class: 'panel' },
    h('h2', { text: title }),
    h('div', { class: 'panel-body' }, ...body),
    h('div', { class: 'panel-actions' }, ...actions),
  );
}

/** Shows "+2" (or "12 / 50") next to a resource icon — no word labels. */
export function resourceChip(
  resource: ResourceId,
  amountText: string,
  opts: { tone?: 'up' | 'down' | 'neutral'; suffix?: string; class?: string } = {},
): HTMLElement {
  const tone = opts.tone ?? 'neutral';
  return h(
    'span',
    {
      class: `resource-chip resource-chip-${tone}${opts.class ? ` ${opts.class}` : ''}`,
      title: RESOURCE_LABELS[resource],
      attrs: { 'aria-label': `${amountText} ${RESOURCE_LABELS[resource]}${opts.suffix ? ` ${opts.suffix}` : ''}` },
    },
    h('span', { class: 'resource-chip-amount', text: amountText }),
    assetBox(`icon_${resource}`, { compact: true, class: 'resource-chip-icon' }),
    opts.suffix ? h('span', { class: 'resource-chip-suffix', text: opts.suffix }) : null,
  );
}

export function changeLine(c: ResourceChange): HTMLElement {
  const up = c.delta >= 0;
  const signed = `${up ? '+' : ''}${c.delta}`;
  return h(
    'li',
    { class: `change ${up ? 'up' : 'down'}` },
    resourceChip(c.resource, signed, {
      tone: up ? 'up' : 'down',
      suffix: c.field === 'max' ? 'max' : undefined,
    }),
    h('span', { class: 'reason', text: ` — ${c.reason}` }),
  );
}

export function changeList(changes: ResourceChange[]): HTMLElement | null {
  const shown = changes.filter((c) => c.delta !== 0);
  return shown.length ? h('ul', { class: 'changes' }, ...shown.map(changeLine)) : null;
}

export function dialogueBox(speaker: Speaker, text: string, actions: Child[]): HTMLElement {
  return h(
    'div',
    { class: 'dialogue-box' },
    assetBox(`char_${speaker}_portrait`, { compact: true, class: 'portrait' }),
    h('div', { class: 'dialogue-text' }, h('strong', { text: SPEAKER_NAMES[speaker] }), h('p', { text })),
    h('div', { class: 'dialogue-actions' }, ...actions),
  );
}

export function modal(
  title: string,
  body: Child[],
  onClose: () => void,
  opts: { class?: string } = {},
): HTMLElement {
  const backdrop = h(
    'div',
    { class: 'modal-backdrop' },
    h(
      'div',
      {
        class: `modal${opts.class ? ` ${opts.class}` : ''}`,
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      },
      h(
        'header',
        { class: 'modal-header' },
        h('button', { class: 'btn btn-secondary modal-close', text: 'X Close', onClick: () => onClose() }),
        h('div', { class: 'modal-title-block' }, h('h2', { text: title })),
        h('span', { class: 'modal-header-spacer', attrs: { 'aria-hidden': 'true' } }),
      ),
      h('div', { class: 'modal-body' }, ...body),
    ),
  );
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) onClose();
  });
  return backdrop;
}

export function toast(
  data: { text?: string; apSpent?: number; changes?: ResourceChange[] } | null,
): HTMLElement | null {
  if (!data) return null;
  const chips: Child[] = [];
  if (data.apSpent && data.apSpent > 0) {
    chips.push(
      h(
        'span',
        { class: 'resource-chip resource-chip-down', title: 'Action Points' },
        h('span', { class: 'resource-chip-amount', text: `−${data.apSpent}` }),
        assetBox('icon_ap', { compact: true, class: 'resource-chip-icon' }),
      ),
    );
  }
  for (const c of data.changes ?? []) {
    chips.push(
      resourceChip(c.resource, `${c.delta > 0 ? '+' : ''}${c.delta}`, {
        tone: c.delta >= 0 ? 'up' : 'down',
        suffix: c.field === 'max' ? 'max' : undefined,
      }),
    );
  }
  return h(
    'div',
    { class: 'toast', attrs: { role: 'status' } },
    data.text ? h('span', { class: 'toast-text', text: data.text }) : null,
    chips.length > 0 ? h('span', { class: 'toast-chips chip-row' }, ...chips) : null,
  );
}
