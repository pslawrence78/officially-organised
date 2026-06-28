import { describe, expect, it } from "vitest";
import { hashPayload, stableStringify } from "./syncHasher";

describe("syncHasher", () => {
  it("produces a stable string regardless of object key order", () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }));
  });

  it("hashes equal payloads to the same value", async () => {
    const left = await hashPayload({ b: 2, a: 1 });
    const right = await hashPayload({ a: 1, b: 2 });
    expect(left).toBe(right);
  });
});
