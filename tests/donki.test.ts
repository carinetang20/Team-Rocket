import { describe, expect, it } from "vitest";
import { fetchSpaceWeather } from "../src/data/nasa/donki.js";

describe("fetchSpaceWeather", () => {
  it("returns live snapshot when DONKI responds", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("/FLR")) {
        return new Response(
          JSON.stringify([
            {
              flrID: "2024-01-01",
              beginTime: "2024-01-01T00:00Z",
              classType: "M1.0",
            },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/CME")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes("/SEP")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response("nope", { status: 404 });
    };

    const snap = await fetchSpaceWeather({
      apiKey: "TEST_KEY",
      fetchImpl,
    });
    expect(snap.source).toBe("live");
    expect(snap.flareCount).toBe(1);
    expect(snap.attribution).toMatch(/DONKI/);
  });

  it("falls back to curated data when live fetch fails", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("network down");
    };
    const snap = await fetchSpaceWeather({ fetchImpl });
    expect(snap.source).toBe("curated");
    expect(snap.events.length).toBeGreaterThan(0);
  });
});
