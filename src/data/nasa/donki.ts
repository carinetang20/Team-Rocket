import { DONKI_ATTRIBUTION, getCuratedSpaceWeather } from "./curated.js";
import type { SpaceWeatherEvent, SpaceWeatherSnapshot } from "../../engine/types.js";

const NASA_API_BASE = "https://api.nasa.gov/DONKI";

export interface DonkiFetchOptions {
  /** NASA api.nasa.gov key. Falls back to DEMO_KEY (rate-limited). */
  apiKey?: string;
  /** Look-back window in days (max ~30 for DONKI). */
  lookbackDays?: number;
  /** Inject fetch for tests. */
  fetchImpl?: typeof fetch;
}

function readEnvApiKey(): string | undefined {
  try {
    // Node / Vitest
    if (typeof process !== "undefined" && process.env?.NASA_API_KEY) {
      return process.env.NASA_API_KEY;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Try live DONKI; on any failure return curated real data.
 * Never labels curated data as live.
 */
export async function fetchSpaceWeather(
  options: DonkiFetchOptions = {},
): Promise<SpaceWeatherSnapshot> {
  const apiKey = options.apiKey ?? readEnvApiKey() ?? "DEMO_KEY";
  const lookbackDays = options.lookbackDays ?? 7;
  const fetchImpl = options.fetchImpl ?? fetch;

  const end = new Date();
  const start = new Date(end.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  try {
    const [flares, cmes, seps] = await Promise.all([
      getJson(
        `${NASA_API_BASE}/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`,
        fetchImpl,
      ),
      getJson(
        `${NASA_API_BASE}/CME?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`,
        fetchImpl,
      ),
      getJson(
        `${NASA_API_BASE}/SEP?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey}`,
        fetchImpl,
      ),
    ]);

    const flareRows = asArray(flares);
    const cmeRows = asArray(cmes);
    const sepRows = asArray(seps);

    const events: SpaceWeatherEvent[] = [
      ...flareRows.slice(0, 5).map((row) => mapEvent("FLR", row)),
      ...cmeRows.slice(0, 5).map((row) => mapEvent("CME", row)),
      ...sepRows.slice(0, 5).map((row) => mapEvent("SEP", row)),
    ];

    const flareCount = flareRows.length;
    const cmeCount = cmeRows.length;
    const sepCount = sepRows.length;
    const severityMultiplier = Number(
      Math.min(
        2.2,
        1 + flareCount * 0.05 + cmeCount * 0.08 + sepCount * 0.15,
      ).toFixed(2),
    );

    return {
      source: "live",
      fetchedAt: new Date().toISOString(),
      attribution: DONKI_ATTRIBUTION,
      flareCount,
      cmeCount,
      sepCount,
      severityMultiplier,
      summary: `Live NASA DONKI (${lookbackDays}d): ${flareCount} flares, ${cmeCount} CMEs, ${sepCount} SEPs. Hazard intensity ×${severityMultiplier.toFixed(2)}.`,
      events,
    };
  } catch {
    return getCuratedSpaceWeather(Math.floor(Date.now() / 86_400_000));
  }
}

async function getJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`DONKI HTTP ${res.status}`);
  }
  return res.json();
}

function asArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") return [data as Record<string, unknown>];
  return [];
}

function mapEvent(
  type: SpaceWeatherEvent["type"],
  row: Record<string, unknown>,
): SpaceWeatherEvent {
  const id = String(
    row.flrID ??
      row.activityID ??
      row.sepID ??
      row.link ??
      `${type}-${row.beginTime ?? "unknown"}`,
  );
  const startTime = String(row.beginTime ?? row.startTime ?? row.eventTime ?? "");
  const note =
    type === "FLR"
      ? `Solar flare class ${String(row.classType ?? "unknown")}`
      : type === "CME"
        ? `CME detected${row.speed ? ` (~${String(row.speed)} km/s)` : ""}`
        : `Solar energetic particle event`;

  return { type, id, startTime, note };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export { getCuratedSpaceWeather, DONKI_ATTRIBUTION };
