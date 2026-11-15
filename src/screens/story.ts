// Cutscene-style screen: the opening story.

import { OPENING_SLIDES } from '../content/dialogue';
import type { FlowContext } from '../flow/flow';
import { assetBox } from './assets';
import { screen } from './common';
import { button, h } from './dom';

export function openingScreen(ctx: FlowContext): HTMLElement {
  let index = 0;
  const stage = h('div', { class: 'cutscene' });

  const draw = () => {
    const slide = OPENING_SLIDES[index];
    if (!slide) return ctx.actions.next();
    const last = index === OPENING_SLIDES.length - 1;
    stage.replaceChildren(
      assetBox(slide.asset, { class: 'cutscene-image' }),
      h('p', { class: 'cutscene-text', text: slide.text }),
      h(
        'div',
        { class: 'panel-actions' },
        button('Skip', ctx.actions.next, { variant: 'secondary' }),
        button(last ? 'Play!' : 'Next', () => {
          index += 1;
          draw();
        }),
      ),
    );
  };
  draw();
  return screen('opening', stage);
}
