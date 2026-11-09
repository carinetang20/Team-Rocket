// Developer tools for testing screens quickly. Open with ?debug in the URL, or press the ` key.
// Not shown to players by default.

import { RESOURCE_IDS } from '../contract/types';
import { h } from '../screens/dom';
import type { Flow } from './flow';
import { clearProfile, clearSave } from './save';

let enabled = new URLSearchParams(window.location.search).has('debug');

export function toggleDebug(): void {
  enabled = !enabled;
}

function btn(label: string, onClick: () => void): HTMLButtonElement {
  return h('button', { class: 'debug-btn', text: label, onClick: () => onClick() });
}

export function debugPanel(flow: Flow): HTMLElement | null {
  if (!enabled) return null;
  const s = flow.state;
  const finalDay = flow.rules.finalDay;
  const required = flow.rules.endingRequired;

  return h(
    'aside',
    { class: 'debug-panel' },
    h('strong', { text: `DEBUG · screen: ${flow.screen}${s ? ` · day ${s.day} · ${s.phase}` : ''}` }),
    s &&
      h(
        'div',
        { class: 'debug-row' },
        btn('Day 2 (hazard warning)', () =>
          flow.debugMutate((st) => {
            st.day = 2;
            st.upcoming = { day: 3, kind: 'hazard', hazardId: 'dustStorm', hazardName: 'Dust Storm' };
          }),
        ),
        btn('Day 3 (hazard tonight)', () =>
          flow.debugMutate((st) => {
            st.day = 3;
            st.upcoming = { day: 3, kind: 'hazard', hazardId: 'meteorShower', hazardName: 'Meteor Shower' };
          }),
        ),
        btn(`Day ${finalDay - 1} (last day, boss next)`, () =>
          flow.debugMutate((st) => {
            st.day = finalDay - 1;
            st.ap = st.apCap;
            st.upcoming = { day: finalDay, kind: 'boss' };
          }),
        ),
        btn(`All stats → ${required}`, () =>
          flow.debugMutate((st) => {
            for (const r of RESOURCE_IDS) {
              st.resources[r].max = Math.max(st.resources[r].max, required);
              st.resources[r].current = required;
            }
          }),
        ),
        btn('Health → 1, Oxygen → 0', () =>
          flow.debugMutate((st) => {
            st.resources.health.current = 1;
            st.resources.oxygen.current = 0;
            st.lowStreaks.oxygen = 3;
          }),
        ),
        btn('Full AP', () => flow.debugMutate((st) => (st.ap = st.apCap))),
      ),
    h(
      'div',
      { class: 'debug-row' },
      btn('Clear save + profile', () => {
        clearSave();
        clearProfile();
        window.location.reload();
      }),
      btn('Hide (`)', () => {
        enabled = false;
        flow.render();
      }),
    ),
  );
}
