// Background music manifest. Human-readable version: docs/asset-list.md §6b (keep both in sync).
//
// Files go in public/assets/music/. They are generated chiptune loops (tools/music/generate.ts,
// `npm run music`); swap in better ones with the same name. A missing file just means no music.

export type MusicId = 'title' | 'outpost' | 'boss';

export interface MusicEntry {
  file: string;
  /** 0..1, multiplied with the master volume. Kept low so sound effects stay clear. */
  volume: number;
  use: string;
}

export const MUSIC: Record<MusicId, MusicEntry> = {
  title: { file: 'music/title.wav', volume: 0.35, use: 'Title, opening story, results' },
  outpost: { file: 'music/outpost.wav', volume: 0.3, use: 'Days 1–13: outpost and daily pop-ups' },
  boss: { file: 'music/boss.wav', volume: 0.3, use: 'Day 14 (last day) and the Day 15 plan choice' },
};

/** Seconds for one track to fade into the next. */
export const MUSIC_FADE_SECONDS = 0.8;
