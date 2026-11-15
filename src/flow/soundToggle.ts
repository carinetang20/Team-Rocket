// Sound on/off button, shown in the corner of every screen. Icon + word (never icon alone).

import { h } from '../screens/dom';
import { isMuted, playSound, setMuted } from './sound';

function paint(btn: HTMLButtonElement): void {
  const off = isMuted();
  btn.textContent = off ? '🔇 Sound off' : '🔊 Sound on';
  btn.setAttribute('aria-pressed', String(!off));
  btn.setAttribute('aria-label', off ? 'Sound is off. Turn sound on.' : 'Sound is on. Turn sound off.');
  btn.classList.toggle('is-off', off);
}

export function soundToggleOverlay(): HTMLElement {
  const btn = h('button', { class: 'sound-toggle', attrs: { type: 'button' } });
  paint(btn);
  btn.addEventListener('click', () => {
    setMuted(!isMuted());
    paint(btn); // update in place; no need to redraw the whole screen
    if (!isMuted()) playSound('click');
  });
  return btn;
}
