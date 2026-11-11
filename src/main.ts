import './screens/placeholder.css';
import { createEngine } from './engine';
import { debugPanel, toggleDebug } from './flow/debug';
import { Flow } from './flow/flow';
import { toastOverlay } from './flow/toastOverlay';
import { SCREENS } from './screens';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app element in index.html');

// Person A real engine (src/engine/). Fake engine remains in src/fake-engine/ for reference.
const engine = createEngine();

const flow = new Flow(engine, SCREENS, root, [toastOverlay, debugPanel]);

window.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    toggleDebug();
    flow.render();
  }
});

flow.render();
