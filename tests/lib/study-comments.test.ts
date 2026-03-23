import { describe, expect, it } from "vitest";
import { normalizeAnnotation, parseOpeningVariantCommentInput } from "@/lib/study-comments";

describe("study comments helpers", () => {
  it("normalizes supported annotations only", () => {
    expect(normalizeAnnotation("!!")).toBe("!!");
    expect(normalizeAnnotation("brilliant")).toBeNull();
    expect(normalizeAnnotation(42)).toBeNull();
  });

  it("validates upsert payloads and trims comment fields", () => {
    const parsed = parseOpeningVariantCommentInput(
      {
        moveKey: " 1. e4 > c5 ",
        comment: "  Good central control  ",
        annotation: "!?",
      },
      { username: "alice", eco: "B20", variantId: "B20:main-line", moveKey: "" }
    );

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.identity).toEqual({
        username: "alice",
        eco: "B20",
        variantId: "B20:main-line",
        moveKey: "1. e4 > c5",
      });
      expect(parsed.data.comment).toBe("Good central control");
      expect(parsed.data.annotation).toBe("!?");
    }
  });

  it("rejects payloads missing a move key or comment", () => {
    expect(
      parseOpeningVariantCommentInput(
        { comment: "", moveKey: "a" },
        { username: "alice", eco: "B20", variantId: "B20:main-line", moveKey: "" }
      )
    ).toEqual({ ok: false, status: 400, error: "Comment is required" });

    expect(
      parseOpeningVariantCommentInput(
        { comment: "hello", moveKey: "   " },
        { username: "alice", eco: "B20", variantId: "B20:main-line", moveKey: "" }
      )
    ).toEqual({ ok: false, status: 400, error: "moveKey is required" });
  });
});
