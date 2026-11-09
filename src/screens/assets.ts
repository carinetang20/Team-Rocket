// Shows an image from the asset manifest, or a grey placeholder box at the same size if the
// file isn't in public/assets/ yet. When artists add the file, it appears automatically.

import { ASSETS, type AssetEntry } from '../content/assetManifest';
import { h } from './dom';

const loaded = new Map<string, boolean>();

function url(entry: AssetEntry): string {
  return `assets/${entry.file}`;
}

function whenLoaded(src: string, onOk: () => void): void {
  const known = loaded.get(src);
  if (known === true) return onOk();
  if (known === false) return;
  const img = new Image();
  img.onload = () => {
    loaded.set(src, true);
    onOk();
  };
  img.onerror = () => loaded.set(src, false);
  img.src = src;
}

/**
 * A box with the asset's exact aspect ratio.
 * compact: show only a short label (for small icons/portraits).
 */
export function assetBox(id: string, opts: { compact?: boolean; class?: string } = {}): HTMLElement {
  const entry = ASSETS[id];
  const el = h('div', { class: `asset ${opts.class ?? ''}` });
  if (!entry) {
    el.append(h('span', { class: 'asset-label', text: `?? ${id}` }));
    return el;
  }
  el.style.aspectRatio = `${entry.width} / ${entry.height}`;
  el.append(
    h('span', {
      class: 'asset-label',
      text: opts.compact ? entry.label : `${entry.label}\n${entry.file}\n${entry.width}×${entry.height}`,
    }),
  );
  const src = url(entry);
  whenLoaded(src, () => {
    el.style.backgroundImage = `url("${src}")`;
    el.classList.add('loaded');
  });
  return el;
}

/** Use an asset as a container's background (e.g. the outpost scene). */
export function assetBackground<T extends HTMLElement>(el: T, id: string): T {
  const entry = ASSETS[id];
  if (!entry) return el;
  el.classList.add('asset-bg');
  el.append(h('span', { class: 'asset-bg-label', text: `${entry.file} (${entry.width}×${entry.height})` }));
  const src = url(entry);
  whenLoaded(src, () => {
    el.style.backgroundImage = `url("${src}")`;
    el.classList.add('loaded');
  });
  return el;
}
