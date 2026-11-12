import { describe, expect, it } from "vitest";
import { MAX_UNBROKEN_WORD, breakLongWord } from "./theme";

describe("breakLongWord", () => {
  it("keeps ordinary words, names and amounts whole", () => {
    for (const word of ["Lotus", "₹1,23,45,678", "BW-P-001", "a".repeat(MAX_UNBROKEN_WORD)]) {
      expect(breakLongWord(word)).toEqual([word]);
    }
  });

  it("splits a long word into chunks that rejoin to the original", () => {
    const url = "https://bongweb.in/work/riverside-cafe-concept";
    const parts = breakLongWord(url);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join("")).toBe(url);
    expect(Math.max(...parts.map((p) => p.length))).toBeLessThanOrEqual(8);
  });
});
