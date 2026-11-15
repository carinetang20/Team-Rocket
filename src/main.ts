import './screens/placeholder.css';
import { createEngine } from './engine';
import { debugPanel, toggleDebug } from './flow/debug';
import { Flow } from './flow/flow';
import { playSound, preloadSounds, unlockAudioOnFirstInput } from './flow/sound';
import { soundToggleOverlay } from './flow/soundToggle';
import { toastOverlay } from './flow/toastOverlay';
import { SCREENS } from './screens';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app element in index.html');

// Person A real engine (src/engine/). Fake engine remains in src/fake-engine/ for reference.
const engine = createEngine();

const flow = new Flow(engine, SCREENS, root, [toastOverlay, soundToggleOverlay, debugPanel]);

preloadSounds();
unlockAudioOnFirstInput();
// Soft click for every button. Actions with their own sound (upgrade, open…) override it,
// because only the most important sound from one click is played (see flow/sound.ts).
root.addEventListener(
  'click',
  (e) => {
    if ((e.target as HTMLElement).closest('button, [role="button"], .map-stage.pointing')) playSound('click');
  },
  true,
);

window.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    toggleDebug();
    flow.render();
  }
});

flow.render();
