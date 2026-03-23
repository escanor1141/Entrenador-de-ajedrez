import { describe, expect, it } from "vitest";
import {
  classifyCentipawnLoss,
  classifyReviewMove,
  DEFAULT_REVIEW_CLASSIFICATION_THRESHOLDS,
  getCentipawnLoss,
  normalizeEngineScore,
} from "@/lib/review-evaluation";

describe("review evaluation helpers", () => {
  it("normalizes cp scores without changing their value", () => {
    expect(normalizeEngineScore({ kind: "cp", cp: 42 })).toBe(42);
    expect(normalizeEngineScore({ kind: "cp", cp: -120 })).toBe(-120);
  });

  it("orders mate scores ahead of cp scores", () => {
    expect(normalizeEngineScore({ kind: "mate", mate: 3 })).toBeGreaterThan(
      normalizeEngineScore({ kind: "cp", cp: 90_000 })
    );
    expect(normalizeEngineScore({ kind: "mate", mate: -3 })).toBeLessThan(
      normalizeEngineScore({ kind: "cp", cp: -90_000 })
    );
  });

  it.each([
    [0, "best"],
    [15, "best"],
    [16, "good"],
    [50, "good"],
    [51, "inaccuracy"],
    [100, "inaccuracy"],
    [101, "mistake"],
    [300, "mistake"],
    [301, "blunder"],
  ] as const)("classifies centipawn loss %s as %s", (loss, expected) => {
    expect(classifyCentipawnLoss(loss)).toBe(expected);
  });

  it("supports configurable thresholds", () => {
    expect(
      classifyCentipawnLoss(12, {
        best: 10,
        good: 20,
        inaccuracy: 30,
        mistake: 40,
      })
    ).toBe("good");
  });

  it("computes mate-aware loss before classification", () => {
    expect(
      getCentipawnLoss({ kind: "mate", mate: 3 }, { kind: "cp", cp: 0 })
    ).toBeGreaterThan(DEFAULT_REVIEW_CLASSIFICATION_THRESHOLDS.mistake);
    expect(
      classifyReviewMove({ kind: "mate", mate: 3 }, { kind: "cp", cp: 0 })
    ).toBe("blunder");
  });

  it("treats a mating line as better than a cp gain", () => {
    expect(
      classifyReviewMove({ kind: "cp", cp: 50 }, { kind: "mate", mate: 2 })
    ).toBe("best");
  });

  it("handles mate-vs-mate comparisons", () => {
    expect(
      classifyReviewMove({ kind: "mate", mate: 5 }, { kind: "mate", mate: 3 })
    ).toBe("best");
    expect(
      classifyReviewMove({ kind: "mate", mate: 3 }, { kind: "mate", mate: -1 })
    ).toBe("blunder");
  });
});
