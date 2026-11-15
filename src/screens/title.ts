import { STRATEGIES } from '../contract/types';
import { SI_CREDIT } from '../content/dialogue';
import type { FlowContext } from '../flow/flow';
import { assetBox } from './assets';
import { screen } from './common';
import { button, h } from './dom';

export function titleScreen(ctx: FlowContext): HTMLElement {
  const unlocked = ctx.profile.endingsUnlocked.length;
  const content = h(
    'div',
    { class: 'title-content' },
    assetBox('ui_logo', { class: 'logo' }),
    // The logo image shows the name; the heading stays for screen readers.
    h('h1', { class: 'sr-only', text: 'MARTIAN: Mars Outpost Survival' }),
    h(
      'div',
      { class: 'title-buttons' },
      button('New Game', ctx.actions.newGame),
      button('Continue', ctx.actions.continueGame, {
        variant: 'secondary',
        disabled: !ctx.hasSave,
        title: ctx.hasSave ? 'Continue' : 'No save yet',
      }),
    ),
    unlocked > 0 && h('p', { class: 'muted', text: `Endings ${unlocked}/${STRATEGIES.length}` }),
    h('p', { class: 'si-credit', text: SI_CREDIT }),
  );
  // No background image: the Mars-sky gradient comes from CSS (.screen-title).
  return screen('title', h('div', { class: 'fullscreen' }, content));
}
