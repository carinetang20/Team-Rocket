// Shared placeholder building blocks used by several screens.
// Person C will replace these with real UI components in src/ui/.

import type { ResourceChange } from '../contract/types';
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

export function changeLine(c: ResourceChange): HTMLElement {
  const up = c.delta >= 0;
  const what = `${RESOURCE_LABELS[c.resource]}${c.field === 'max' ? ' max capacity' : ''}`;
  return h(
    'li',
    { class: `change ${up ? 'up' : 'down'}` },
    h('span', { class: 'arrow', text: up ? '▲' : '▼' }),
    ` ${up ? '+' : ''}${c.delta} ${what}`,
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

export function modal(title: string, body: Child[], onClose: () => void): HTMLElement {
  const backdrop = h(
    'div',
    { class: 'modal-backdrop' },
    h(
      'div',
      { class: 'modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } },
      h(
        'header',
        { class: 'modal-header' },
        h('h2', { text: title }),
        h('button', { class: 'btn btn-secondary', text: '✕ Close', onClick: () => onClose() }),
      ),
      h('div', { class: 'modal-body' }, ...body),
    ),
  );
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) onClose();
  });
  return backdrop;
}

export function toast(message: string | null): HTMLElement | null {
  return message ? h('div', { class: 'toast', attrs: { role: 'status' }, text: message }) : null;
}
