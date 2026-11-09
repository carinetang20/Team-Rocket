import { CONFIG } from "./config.js";
import type { EndingId, GameState, StatId, Stats } from "./types.js";

export interface BossResult {
  ending: EndingId;
  title: string;
  blurb: string;
  messages: string[];
}

/** Tie-break order when two stats share the same top value. */
const TIE_BREAK: EndingId[] = ["shield", "food", "power", "health"];

const ENDING_META: Record<
  Exclude<EndingId, "bad" | "game_over">,
  { stat: StatId; title: string; blurb: string; winLine: string }
> = {
  shield: {
    stat: "shield",
    title: "Shield ending",
    blurb:
      "The alien boss slams into the barrier — and bounces off. Shields were too strong. It flees into the red dusk.",
    winLine: "Alien boss unable to break the shield. Alien boss flees!",
  },
  food: {
    stat: "hunger",
    title: "Food ending",
    blurb:
      "You offer a feast from the greenhouse. The alien boss eats until it can barely move, then wanders off full and happy.",
    winLine: "Alien boss gets full and leaves.",
  },
  power: {
    stat: "power",
    title: "Power ending",
    blurb:
      "The boss wrecks the power station — and shocks itself on the live grid. Sparks fly. It retreats, smoking.",
    winLine: "Alien boss shocks itself on the power station and leaves.",
  },
  health: {
    stat: "health",
    title: "Health ending",
    blurb:
      "The crew is strong enough to evacuate in time. Rockets fire. You make it back toward Earth safely.",
    winLine: "Team evacuates the outpost and returns toward Earth.",
  },
};

/**
 * Day-15 alien boss.
 * Among stats that reach the threshold, the strongest one decides the ending
 * (so food/power/health builds are not always shadowed by a decent shield).
 * Ties use plan order: shield → food → power → health.
 */
export function resolveBoss(stats: Stats): BossResult {
  const t = CONFIG.endingThreshold;

  const qualified = (
    Object.entries(ENDING_META) as Array<
      [Exclude<EndingId, "bad" | "game_over">, (typeof ENDING_META)["shield"]]
    >
  )
    .map(([ending, meta]) => ({
      ending,
      meta,
      value: stats[meta.stat].current,
    }))
    .filter((row) => row.value >= t);

  if (qualified.length === 0) {
    return {
      ending: "bad",
      title: "Bad ending",
      blurb:
        "Nothing was ready. The alien boss smashes the outpost again. Back to square one…",
      messages: [
        `No stat reached ${t}.`,
        `Final stats — hunger ${stats.hunger.current}, power ${stats.power.current}, shield ${stats.shield.current}, health ${stats.health.current}.`,
        "Alien boss destroys the outpost. Mission failed.",
      ],
    };
  }

  qualified.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return TIE_BREAK.indexOf(a.ending) - TIE_BREAK.indexOf(b.ending);
  });

  const winner = qualified[0]!;
  return {
    ending: winner.ending,
    title: winner.meta.title,
    blurb: winner.meta.blurb,
    messages: [
      `${winner.meta.stat} ${winner.value} led the qualifying stats (≥ ${t}).`,
      winner.meta.winLine,
    ],
  };
}

export function endingBlurbFor(state: GameState): string | null {
  if (!state.ending) return null;
  if (state.ending === "game_over") {
    return "A core system hit zero. The outpost could not survive another sol.";
  }
  if (state.ending === "bad") {
    return resolveBoss(state.stats).blurb;
  }
  return ENDING_META[state.ending]?.blurb ?? resolveBoss(state.stats).blurb;
}
