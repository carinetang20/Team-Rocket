import { STRATEGIES } from '../contract/types';
import type { FlowContext } from '../flow/flow';
import { assetBackground, assetBox } from './assets';
import { screen, toast } from './common';
import { button, h } from './dom';

export function titleScreen(ctx: FlowContext): HTMLElement {
  const unlocked = ctx.profile.endingsUnlocked.length;
  const content = h(
    'div',
    { class: 'title-content' },
    assetBox('ui_logo', { class: 'logo' }),
    h('h1', { text: 'Mars Outpost Survival' }),
    h(
      'div',
      { class: 'title-buttons' },
      button('New Game', ctx.actions.newGame),
      button('Continue', ctx.actions.continueGame, {
        variant: 'secondary',
        disabled: !ctx.hasSave,
        title: ctx.hasSave ? 'Continue your saved game' : 'No saved game yet',
      }),
    ),
    unlocked > 0 && h('p', { class: 'muted', text: `Endings unlocked: ${unlocked} / ${STRATEGIES.length}` }),
    h('p', { class: 'muted small', text: 'Prototype build — grey boxes are placeholders. Press ` for debug tools.' }),
  );
  return screen('title', assetBackground(h('div', { class: 'fullscreen' }, content), 'bg_title'), toast(ctx.toast));
}
