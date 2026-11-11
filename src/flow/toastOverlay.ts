// Global toast overlay — shown on every screen after actions like Do it.

import { toast } from '../screens/common';
import type { Flow } from './flow';

export function toastOverlay(flow: Flow): HTMLElement | null {
  return toast(flow.toast);
}
