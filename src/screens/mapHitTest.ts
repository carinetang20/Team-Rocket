// Pixel-accurate clicking for the outpost map.
//
// Every building layer is a full-map-size PNG that is see-through except for the building.
// A plain click handler on the <img> would fire anywhere on the map, so instead we keep a
// small copy of each layer's transparency and ask "is there building under this point?".

/** Masks are stored smaller than the art (1440 → 360 wide). Plenty for a finger or mouse. */
const MASK_WIDTH = 360;
/** Alpha above this counts as "building" (ignores faint anti-aliased edges). */
const ALPHA_THRESHOLD = 40;

interface Mask {
  width: number;
  height: number;
  solid: Uint8Array;
}

const masks = new Map<string, Mask>();
const pending = new Set<string>();

/** Start building the mask for an image (once per URL, shared across re-renders). */
export function prepareMask(src: string): void {
  if (masks.has(src) || pending.has(src)) return;
  pending.add(src);
  const img = new Image();
  img.onload = () => {
    pending.delete(src);
    const width = MASK_WIDTH;
    const height = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * width));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const g = canvas.getContext('2d', { willReadFrequently: true });
    if (!g) return;
    g.drawImage(img, 0, 0, width, height);
    const rgba = g.getImageData(0, 0, width, height).data;
    const solid = new Uint8Array(width * height);
    for (let i = 0; i < solid.length; i++) solid[i] = rgba[i * 4 + 3]! > ALPHA_THRESHOLD ? 1 : 0;
    masks.set(src, { width, height, solid });
  };
  img.onerror = () => pending.delete(src);
  img.src = src;
}

/**
 * Is the point (fx, fy) — fractions 0..1 across/down the map — on a visible pixel of this layer?
 * Returns false while the mask is still loading.
 */
export function isSolidAt(src: string, fx: number, fy: number): boolean {
  const m = masks.get(src);
  if (!m || fx < 0 || fy < 0 || fx >= 1 || fy >= 1) return false;
  const x = Math.floor(fx * m.width);
  const y = Math.floor(fy * m.height);
  return m.solid[y * m.width + x] === 1;
}
