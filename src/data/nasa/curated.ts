import type { SpaceWeatherEvent, SpaceWeatherSnapshot } from "../../engine/types.js";

/**
 * Curated real DONKI-derived events (historical).
 * Presented as curated — never as "live" — per project plan.
 *
 * Sources: NASA CCMC DONKI (Database Of Notifications, Knowledge, Information)
 * https://ccmc.gsfc.nasa.gov/tools/DONKI/
 */
const CURATED_EVENTS: SpaceWeatherEvent[] = [
  {
    type: "FLR",
    id: "2024-05-10T06:54:00-FLR-001",
    startTime: "2024-05-10T06:54Z",
    note: "X3.9-class solar flare (historical DONKI record).",
  },
  {
    type: "CME",
    id: "2024-05-10T13:36:00-CME-001",
    startTime: "2024-05-10T13:36Z",
    note: "Halo CME linked to May 2024 solar storm sequence.",
  },
  {
    type: "SEP",
    id: "2024-05-10T14:50:00-SEP-001",
    startTime: "2024-05-10T14:50Z",
    note: "Solar energetic particle event — elevated radiation risk.",
  },
  {
    type: "GST",
    id: "2024-05-10T15:00:00-GST-001",
    startTime: "2024-05-10T15:00Z",
    note: "Severe geomagnetic storm (G5-class period, May 2024).",
  },
  {
    type: "FLR",
    id: "2024-03-23T00:58:00-FLR-001",
    startTime: "2024-03-23T00:58Z",
    note: "X1.1-class flare from active region AR3614.",
  },
  {
    type: "CME",
    id: "2023-07-28T15:48:00-CME-001",
    startTime: "2023-07-28T15:48Z",
    note: "Fast CME observed by SOHO/LASCO; radiation watch issued.",
  },
];

export const DONKI_ATTRIBUTION =
  "Space weather data from NASA CCMC DONKI (Database Of Notifications, Knowledge, Information). https://ccmc.gsfc.nasa.gov/tools/DONKI/";

/** Build a curated snapshot. Optionally bias severity with a seed index. */
export function getCuratedSpaceWeather(dayIndex = 0): SpaceWeatherSnapshot {
  const start = Math.abs(dayIndex) % CURATED_EVENTS.length;
  const events = [
    CURATED_EVENTS[start]!,
    CURATED_EVENTS[(start + 1) % CURATED_EVENTS.length]!,
    CURATED_EVENTS[(start + 2) % CURATED_EVENTS.length]!,
  ];

  const flareCount = events.filter((e) => e.type === "FLR").length;
  const cmeCount = events.filter((e) => e.type === "CME").length;
  const sepCount = events.filter((e) => e.type === "SEP").length;

  // Map real event density → gameplay severity (calm 1.0 → stormy ~1.6)
  const severityMultiplier = Number(
    (1 + flareCount * 0.15 + cmeCount * 0.2 + sepCount * 0.25).toFixed(2),
  );

  return {
    source: "curated",
    fetchedAt: new Date().toISOString(),
    attribution: DONKI_ATTRIBUTION,
    flareCount,
    cmeCount,
    sepCount,
    severityMultiplier,
    summary: summarize(events, severityMultiplier),
    events,
  };
}

function summarize(events: SpaceWeatherEvent[], severity: number): string {
  const kinds = [...new Set(events.map((e) => e.type))].join(", ");
  return `Curated NASA DONKI sample (${kinds}). Hazard intensity ×${severity.toFixed(2)}.`;
}
