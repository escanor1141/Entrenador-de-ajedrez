import { describe, expect, it } from "vitest";
import { parseGameFilters } from "@/lib/gameFilters";

describe("parseGameFilters", () => {
  it("applies defaults when params are missing", () => {
    const params = new URLSearchParams();

    expect(parseGameFilters(params, { max: 20 })).toEqual({ max: 20 });
  });

  it("parses a valid filter combination", () => {
    const params = new URLSearchParams(
      "time=blitz&perfType=rapid&color=white&since=1700000000000&until=1701000000000&rated=false&max=50"
    );

    expect(parseGameFilters(params)).toEqual({
      max: 50,
      since: 1700000000000,
      until: 1701000000000,
      rated: false,
      perfType: "rapid",
      color: "white",
    });
  });

  it("uses time as a perfType fallback", () => {
    const params = new URLSearchParams("time=blitz&color=black");

    expect(parseGameFilters(params)).toEqual({
      perfType: "blitz",
      color: "black",
    });
  });

  it("ignores invalid values and falls back to defaults", () => {
    const params = new URLSearchParams("perfType=bulletish&color=green&since=nope&until=NaN&rated=yes&max=bad");

    expect(parseGameFilters(params, { max: 15 })).toEqual({ max: 15 });
  });
});
