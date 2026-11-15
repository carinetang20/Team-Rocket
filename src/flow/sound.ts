// Sound effects + background music player (Web Audio). Screens and flow call playSound('upgrade')
// and playMusic('outpost'); which file plays and how loud lives in src/content/sounds.ts and music.ts.
//
// Browsers only allow sound after the player has clicked or pressed a key, so the audio
// system is "unlocked" on the first interaction. Before that, sounds are silently skipped.

import { MUSIC, MUSIC_FADE_SECONDS, type MusicId } from '../content/music';
import { MASTER_VOLUME, SOUNDS, type SoundId } from '../content/sounds';
import { loadMuted, saveMuted } from './save';

let ctx: AudioContext | null = null;
let muted = loadMuted();
// Cached by file path (relative to public/assets/), shared by sounds and music.
const files = new Map<string, Promise<ArrayBuffer | null>>();
const buffers = new Map<string, AudioBuffer>();
const playing = new Set<AudioBufferSourceNode>();

function fetchFile(file: string): Promise<ArrayBuffer | null> {
  let p = files.get(file);
  if (!p) {
    // A missing file (404) or no network just means silence for that sound.
    p = fetch(`assets/${file}`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
    files.set(file, p);
  }
  return p;
}

/** Start downloading every sound (and the music) so the first play isn't delayed. */
export function preloadSounds(): void {
  for (const id of Object.keys(SOUNDS) as SoundId[]) void fetchFile(SOUNDS[id].file);
  for (const id of Object.keys(MUSIC) as MusicId[]) void fetchFile(MUSIC[id].file);
}

function context(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof AudioContext === 'undefined') return null;
  ctx = new AudioContext();
  return ctx;
}

/** Call once at startup: unlocks audio on the first click/tap/key (needed by Safari/iPad). */
export function unlockAudioOnFirstInput(): void {
  const unlock = () => {
    const c = context();
    // Music asked for before the first click (e.g. on the title screen) starts now.
    if (c && c.state === 'suspended') void c.resume().then(syncMusic, () => undefined);
    else void syncMusic();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

async function buffer(c: AudioContext, file: string): Promise<AudioBuffer | null> {
  const have = buffers.get(file);
  if (have) return have;
  const data = await fetchFile(file);
  if (!data) return null;
  try {
    // slice(): decoding detaches the ArrayBuffer, and we may need it again if decoding races.
    const b = await c.decodeAudioData(data.slice(0));
    buffers.set(file, b);
    return b;
  } catch {
    return null;
  }
}

async function start(id: SoundId): Promise<void> {
  const c = context();
  if (!c) return;
  if (c.state === 'suspended') await c.resume().catch(() => undefined);
  if (c.state !== 'running') return;
  const b = await buffer(c, SOUNDS[id].file);
  if (!b || muted) return;
  const src = c.createBufferSource();
  src.buffer = b;
  const gain = c.createGain();
  gain.gain.value = SOUNDS[id].volume * MASTER_VOLUME;
  src.connect(gain).connect(c.destination);
  playing.add(src);
  src.onended = () => playing.delete(src);
  src.start();
}

// One click often triggers several sounds (button click + "upgrade done" + "end of day").
// Collect them for this moment and play only the most important one.
let pending: SoundId | null = null;
let flushScheduled = false;

export function playSound(id: SoundId): void {
  if (muted) return;
  if (pending === null || SOUNDS[id].priority >= SOUNDS[pending].priority) pending = id;
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(() => {
    flushScheduled = false;
    const next = pending;
    pending = null;
    if (next) void start(next);
  }, 0);
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  saveMuted(value);
  if (value) {
    for (const src of playing) src.stop();
    playing.clear();
  }
  void syncMusic();
}

// ---------- Background music ----------
// One looping track at a time. Changing track (or muting) fades the old one out.

let musicWanted: MusicId | null = null;
let musicNow: { id: MusicId; src: AudioBufferSourceNode; gain: GainNode } | null = null;

/** Ask for a track (null = silence). Safe to call on every screen change; same track keeps playing. */
export function playMusic(id: MusicId | null): void {
  musicWanted = id;
  void syncMusic();
}

function fadeOutMusic(c: AudioContext): void {
  if (!musicNow) return;
  const { src, gain } = musicNow;
  musicNow = null;
  gain.gain.setTargetAtTime(0, c.currentTime, MUSIC_FADE_SECONDS / 3);
  src.stop(c.currentTime + MUSIC_FADE_SECONDS * 2);
}

async function syncMusic(): Promise<void> {
  const c = ctx; // don't create the AudioContext here; that happens on the first click
  if (!c || c.state !== 'running') return;
  const want = muted ? null : musicWanted;
  if (musicNow?.id === want) return;
  if (!want) return fadeOutMusic(c);

  const b = await buffer(c, MUSIC[want].file);
  // Things may have changed while the file was loading.
  if (!b || muted || musicWanted !== want || musicNow?.id === want) return;
  fadeOutMusic(c);

  const src = c.createBufferSource();
  src.buffer = b;
  src.loop = true;
  const gain = c.createGain();
  const level = MUSIC[want].volume * MASTER_VOLUME;
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(level, c.currentTime + MUSIC_FADE_SECONDS);
  src.connect(gain).connect(c.destination);
  src.start();
  musicNow = { id: want, src, gain };
}
