import './screens/placeholder.css';
import { createFakeEngine } from './fake-engine/fakeEngine';
import { debugPanel, toggleDebug } from './flow/debug';
import { Flow } from './flow/flow';
import { SCREENS } from './screens';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app element in index.html');

// 👉 When Person A's real engine is ready, replace createFakeEngine() with it. Nothing else changes.
const engine = createFakeEngine();

const flow = new Flow(engine, SCREENS, root, [debugPanel]);

window.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    toggleDebug();
    flow.render();
  }
});

flow.render();
