// Chiptune music generator. Run with `npm run music`.
//
// Writes the game's background music and win/lose jingles to public/assets/music/ as WAV files.
// Everything is synthesised here from note lists (square-wave lead + arpeggio, triangle bass,
// noise drums), so the tracks are original and can be re-tuned by editing the notes below.
//
// Loops are seamless: notes that ring past the end of a loop are wrapped back onto its start.
// WAV (not MP3) on purpose: MP3 adds a short silence at the start that breaks gapless looping.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/assets/music');

// ---------- Notes ----------

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C#5" → MIDI number. */
function midi(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note: ${name}`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return NOTE_INDEX[m[1]!]! + acc + (Number(m[3]) + 1) * 12;
}

const freq = (n: number): number => 440 * 2 ** ((n - 69) / 12);

interface Note {
  /** MIDI number, or null for a rest. */
  pitch: number | null;
  /** Start and length, in beats. */
  start: number;
  beats: number;
}

/** Parse "E5:1.5 D5:0.5 -:2" (note:beats, "-" = rest) into timed notes, starting at `offset` beats. */
function line(text: string, offset = 0): Note[] {
  const notes: Note[] = [];
  let t = offset;
  for (const token of text.trim().split(/\s+/)) {
    const [name, len] = token.split(':');
    const beats = Number(len);
    if (!name || !Number.isFinite(beats)) throw new Error(`Bad token: ${token}`);
    notes.push({ pitch: name === '-' ? null : midi(name), start: t, beats });
    t += beats;
  }
  return notes;
}

/** Join bars written separately (one string per bar, 4 beats each) into one line. */
function bars(...barTexts: string[]): Note[] {
  return barTexts.flatMap((b, i) => {
    const notes = line(b, i * 4);
    const total = notes.reduce((s, n) => s + n.beats, 0);
    if (Math.abs(total - 4) > 1e-9) throw new Error(`Bar ${i + 1} has ${total} beats: ${b}`);
    return notes;
  });
}

// Chords as MIDI note lists (root position, around octave 4).
const CHORDS: Record<string, string[]> = {
  C: ['C4', 'E4', 'G4'],
  Dm: ['D4', 'F4', 'A4'],
  D: ['D4', 'F#4', 'A4'],
  Em: ['E4', 'G4', 'B4'],
  E: ['E4', 'G#4', 'B4'],
  F: ['F4', 'A4', 'C5'],
  G: ['G4', 'B4', 'D5'],
  Am: ['A4', 'C5', 'E5'],
  B: ['B3', 'D#4', 'F#4'],
};

/**
 * Broken-chord arpeggio, one chord per bar. `pattern` picks chord tones by index
 * (0-2 = chord, 3 = root an octave up), one entry per step of `stepBeats`.
 */
function arpeggio(chords: string[], pattern: number[], stepBeats: number): Note[] {
  const notes: Note[] = [];
  chords.forEach((name, bar) => {
    const tones = CHORDS[name]!.map(midi);
    const pick = (i: number) => (i === 3 ? tones[0]! + 12 : tones[i]!);
    const steps = Math.round(4 / stepBeats);
    for (let s = 0; s < steps; s++) {
      notes.push({ pitch: pick(pattern[s % pattern.length]!), start: bar * 4 + s * stepBeats, beats: stepBeats });
    }
  });
  return notes;
}

/** Bass line from chord roots: `pattern` is octave offsets per step (0 = octave 2, 1 = octave 3). */
function bassLine(chords: string[], pattern: number[], stepBeats: number): Note[] {
  const notes: Note[] = [];
  chords.forEach((name, bar) => {
    const root = (midi(CHORDS[name]![0]!) % 12) + 36; // octave 2
    const steps = Math.round(4 / stepBeats);
    for (let s = 0; s < steps; s++) {
      notes.push({ pitch: root + 12 * pattern[s % pattern.length]!, start: bar * 4 + s * stepBeats, beats: stepBeats });
    }
  });
  return notes;
}

// ---------- Instruments ----------

type Wave = 'pulse12' | 'pulse25' | 'pulse50' | 'triangle';

interface Voice {
  wave: Wave;
  volume: number;
  /** Fraction of the note length that is held before release. */
  gate: number;
  /** Level the note decays to after the attack (0..1). */
  sustain: number;
  decay: number;
  vibrato?: boolean;
}

const DUTY: Record<Exclude<Wave, 'triangle'>, number> = { pulse12: 0.125, pulse25: 0.25, pulse50: 0.5 };

/** Smooths the jumps in a square wave so high notes don't sound harsh (PolyBLEP). */
function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

const RELEASE = 0.03;

function renderNote(buf: Float32Array, n: Note, v: Voice, secPerBeat: number): void {
  if (n.pitch === null) return;
  const startS = Math.round(n.start * secPerBeat * SAMPLE_RATE);
  const held = n.beats * secPerBeat * v.gate;
  const total = Math.ceil((held + RELEASE) * SAMPLE_RATE);
  const base = freq(n.pitch);
  let phase = 0;
  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    // Envelope: quick attack, decay to sustain, short release (no clicks).
    let env = t < 0.004 ? t / 0.004 : v.sustain + (1 - v.sustain) * Math.exp(-(t - 0.004) / v.decay);
    if (t > held) env *= Math.max(0, 1 - (t - held) / RELEASE);
    // Gentle vibrato on long lead notes.
    const vib = v.vibrato && t > 0.18 ? 2 ** ((0.12 * Math.sin(2 * Math.PI * 5.5 * t)) / 12) : 1;
    const f = base * vib;
    const dt = f / SAMPLE_RATE;
    let s: number;
    if (v.wave === 'triangle') {
      s = 4 * Math.abs(phase - 0.5) - 1;
    } else {
      const duty = DUTY[v.wave];
      s = (phase < duty ? 1 : -1) + polyBlep(phase, dt) - polyBlep((phase - duty + 1) % 1, dt);
      s -= 2 * duty - 1; // remove the DC offset of narrow pulses
    }
    phase = (phase + dt) % 1;
    const idx = startS + i;
    if (idx < buf.length) buf[idx]! += s * env * v.volume;
  }
}

// Seeded noise so every run produces the same files.
let seed = 12345;
const noise = (): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

type Drum = 'k' | 's' | 'h';

function renderDrum(buf: Float32Array, kind: Drum, atSec: number, volume: number): void {
  const start = Math.round(atSec * SAMPLE_RATE);
  const len = Math.round((kind === 'h' ? 0.06 : kind === 's' ? 0.18 : 0.25) * SAMPLE_RATE);
  let phase = 0;
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    if (kind === 'k') {
      const f = 45 + 90 * Math.exp(-t / 0.03); // pitch drops fast = "thump"
      phase += f / SAMPLE_RATE;
      s = Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.09) * 1.0;
    } else if (kind === 's') {
      phase += 190 / SAMPLE_RATE;
      s = noise() * Math.exp(-t / 0.06) * 0.7 + Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.03) * 0.4;
    } else {
      const n = noise();
      s = (n - prev) * 0.5 * Math.exp(-t / 0.015); // difference = bright, hissy hat
      prev = n;
    }
    const idx = start + i;
    if (idx < buf.length) buf[idx]! += s * volume;
  }
}

/** Drum pattern, one character per step: k = kick, s = snare, h = hi-hat, . = nothing. */
interface DrumPart {
  pattern: string;
  stepBeats: number;
  /** Which bars play (0-based). Default: all. */
  barsOn?: (bar: number) => boolean;
  volume: number;
}

// ---------- Song rendering ----------

interface Song {
  bpm: number;
  bars: number;
  parts: { notes: Note[]; voice: Voice }[];
  drums?: DrumPart[];
  /** true = seamless loop; false = one-shot jingle with a fade-out tail. */
  loop: boolean;
}

function render(song: Song): Float32Array {
  const secPerBeat = 60 / song.bpm;
  const lengthS = Math.round(song.bars * 4 * secPerBeat * SAMPLE_RATE);
  const tail = Math.round(1.5 * SAMPLE_RATE);
  const buf = new Float32Array(lengthS + tail);

  for (const p of song.parts) for (const n of p.notes) renderNote(buf, n, p.voice, secPerBeat);
  for (const d of song.drums ?? []) {
    const stepsPerBar = Math.round(4 / d.stepBeats);
    for (let bar = 0; bar < song.bars; bar++) {
      if (d.barsOn && !d.barsOn(bar)) continue;
      for (let s = 0; s < stepsPerBar; s++) {
        const c = d.pattern[s % d.pattern.length];
        if (c === 'k' || c === 's' || c === 'h') renderDrum(buf, c, (bar * 4 + s * d.stepBeats) * secPerBeat, d.volume);
      }
    }
  }

  let out: Float32Array;
  if (song.loop) {
    // Wrap the ringing tail back onto the start so the loop point is seamless.
    out = buf.slice(0, lengthS);
    for (let i = lengthS; i < buf.length; i++) out[i - lengthS]! += buf[i]!;
  } else {
    out = buf;
    const fade = Math.round(0.4 * SAMPLE_RATE);
    for (let i = 0; i < fade; i++) out[out.length - 1 - i]! *= i / fade;
  }

  // Normalise so every track peaks at the same level; per-track volume is set in the game.
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  const k = peak > 0 ? 0.85 / peak : 1;
  for (let i = 0; i < out.length; i++) out[i]! *= k;
  return out;
}

function writeWav(file: string, samples: Float32Array): void {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(join(OUT_DIR, file), Buffer.concat([header, data]));
  console.log(`${file}: ${(samples.length / SAMPLE_RATE).toFixed(1)}s, ${(data.length / 1024 / 1024).toFixed(2)} MB`);
}

// ---------- Voices ----------

const LEAD: Voice = { wave: 'pulse25', volume: 0.22, gate: 0.85, sustain: 0.6, decay: 0.25, vibrato: true };
const ARP: Voice = { wave: 'pulse12', volume: 0.09, gate: 0.7, sustain: 0.3, decay: 0.08 };
const BASS: Voice = { wave: 'triangle', volume: 0.32, gate: 0.9, sustain: 0.8, decay: 0.3 };

// ---------- Title: calm and a little mysterious (A minor, 84 BPM) ----------

const titleChords = ['Am', 'F', 'C', 'G', 'Am', 'F', 'E', 'E', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'Am'];
const title: Song = {
  bpm: 84,
  bars: 16,
  loop: true,
  parts: [
    {
      voice: LEAD,
      notes: bars(
        '-:4', '-:4', '-:4', '-:4',
        'A4:2 E5:2', 'F5:2 C5:2', 'B4:2 G#4:2', 'E4:3 -:1',
        'E5:1.5 D5:0.5 C5:1 A4:1', 'C5:1.5 D5:0.5 C5:1 A4:1', 'G4:1 C5:1 E5:1 G5:1', 'F5:1.5 E5:0.5 D5:2',
        'C5:1 A4:1 C5:1 F5:1', 'E5:1.5 D5:0.5 B4:2', 'A4:1 C5:1 E5:1 D5:1', 'A4:3 -:1',
      ),
    },
    { voice: ARP, notes: arpeggio(titleChords, [0, 1, 2, 3, 2, 1], 0.25) },
    { voice: BASS, notes: bassLine(titleChords, [0, 0, 1, 0], 1) },
  ],
  drums: [{ pattern: 'k.h.h.h.', stepBeats: 0.5, barsOn: (b) => b >= 8, volume: 0.18 }],
};

// ---------- Outpost: upbeat "let's rebuild" loop (C major, 116 BPM) ----------

const outpostChords = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'];
const outpost: Song = {
  bpm: 116,
  bars: 16,
  loop: true,
  parts: [
    {
      voice: { ...LEAD, volume: 0.2 },
      notes: bars(
        'C5:0.5 E5:0.5 G5:1 E5:0.5 G5:0.5 C6:1',
        'B5:0.5 A5:0.5 E5:1 -:1 A4:0.5 C5:0.5',
        'F5:1 A5:0.5 F5:0.5 C5:1 F5:1',
        'G5:1.5 F5:0.5 E5:0.5 D5:0.5 B4:1',
        'C5:0.5 E5:0.5 G5:1 E5:0.5 G5:0.5 C6:1',
        'D6:0.5 C6:0.5 A5:1 E5:1 C5:1',
        'F5:0.5 G5:0.5 A5:1 G5:0.5 F5:0.5 E5:0.5 D5:0.5',
        'D5:1 G4:0.5 A4:0.5 B4:1 D5:1',
        'A5:1.5 G5:0.5 F5:1 C5:1',
        'B5:1.5 A5:0.5 G5:1 D5:1',
        'G5:1 E5:0.5 G5:0.5 B5:1 G5:1',
        'A5:2 -:1 E5:0.5 G5:0.5',
        'A5:1 C6:1 A5:0.5 G5:0.5 F5:1',
        'G5:1 B5:1 D6:1 B5:1',
        'C6:1.5 G5:0.5 E5:1 G5:1',
        'C6:2 -:2',
      ),
    },
    { voice: ARP, notes: arpeggio(outpostChords, [0, 1, 2, 1], 0.5) },
    { voice: BASS, notes: bassLine(outpostChords, [0, 1], 0.5) },
  ],
  drums: [{ pattern: 'k.h.s.h.k.k.s.h.', stepBeats: 0.25, volume: 0.2 }],
};

// ---------- Boss: fast and tense (E minor, 148 BPM) ----------

const bossChords = ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B', 'Am', 'Am', 'Em', 'Em', 'C', 'D', 'B', 'B'];
const boss: Song = {
  bpm: 148,
  bars: 16,
  loop: true,
  parts: [
    {
      voice: { ...LEAD, wave: 'pulse50', volume: 0.17 },
      notes: bars(
        'E5:1 -:0.5 E5:0.5 G5:1 F#5:1',
        'E5:0.5 D5:0.5 B4:1 -:2',
        'C5:1 -:0.5 C5:0.5 E5:1 D5:1',
        'A4:1 F#4:1 D5:1 F#5:1',
        'E5:1 -:0.5 E5:0.5 G5:1 A5:1',
        'B5:1.5 A5:0.5 G5:1 E5:1',
        'G5:1 E5:1 C5:1 E5:1',
        'D#5:2 F#5:2',
        'A5:1 -:0.5 A5:0.5 C6:1 B5:1',
        'A5:1 E5:1 C5:1 E5:1',
        'G5:1 -:0.5 G5:0.5 B5:1 A5:1',
        'G5:0.5 F#5:0.5 E5:1 B4:2',
        'C5:1 E5:1 G5:1 C6:1',
        'D6:1 C6:1 A5:1 F#5:1',
        'B5:2 A5:1 F#5:1',
        'D#5:2 B4:2',
      ),
    },
    { voice: ARP, notes: arpeggio(bossChords, [0, 2, 3, 2], 0.25) },
    { voice: { ...BASS, gate: 0.7 }, notes: bassLine(bossChords, [0, 0, 0, 0, 0, 0, 0, 1], 0.5) },
  ],
  drums: [{ pattern: 'k.h.s.hkk.h.s.hh', stepBeats: 0.25, volume: 0.22 }],
};

// ---------- Jingles (play once) ----------

const win: Song = {
  bpm: 140,
  bars: 2,
  loop: false,
  parts: [
    { voice: { ...LEAD, volume: 0.24 }, notes: line('C5:0.5 E5:0.5 G5:0.5 C6:1.5 G5:0.5 C6:3 -:1.5') },
    { voice: ARP, notes: arpeggio(['C', 'C'], [0, 1, 2, 3], 0.25).filter((n) => n.start < 6) },
    { voice: BASS, notes: line('C3:1.5 G2:1.5 C3:3 -:2') },
  ],
  drums: [{ pattern: 'k.k.k...', stepBeats: 0.5, barsOn: (b) => b === 0, volume: 0.25 }],
};

const lose: Song = {
  bpm: 96,
  bars: 2,
  loop: false,
  parts: [
    { voice: { ...LEAD, wave: 'pulse50', volume: 0.22 }, notes: line('G4:1 F#4:1 F4:1 E4:3 -:2') },
    { voice: BASS, notes: line('C3:1 B2:1 Bb2:1 A2:3 -:2') },
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
writeWav('title.wav', render(title));
writeWav('outpost.wav', render(outpost));
writeWav('boss.wav', render(boss));
writeWav('win.wav', render(win));
writeWav('lose.wav', render(lose));
