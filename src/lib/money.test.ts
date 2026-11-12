import { describe, expect, it } from "vitest";
import { amountInWords, formatAmount, integerToWords, lineAmount, splitByPercent } from "./money";

describe("integerToWords", () => {
  it.each([
    [0, "zero"],
    [1, "one"],
    [19, "nineteen"],
    [45, "forty-five"],
    [100, "one hundred"],
    [18_000, "eighteen thousand"],
    [1_00_000, "one lakh"],
    [12_34_56_789, "twelve crore thirty-four lakh fifty-six thousand seven hundred eighty-nine"],
    [
      1_23_45_67_890,
      "one hundred twenty-three crore forty-five lakh sixty-seven thousand eight hundred ninety",
    ],
  ])("%d", (n, words) => expect(integerToWords(n)).toBe(words));
});

describe("amountInWords", () => {
  it("formats whole rupees", () => expect(amountInWords(18_000_00)).toBe("Rupees eighteen thousand only"));
  it("includes paise", () => expect(amountInWords(10_50)).toBe("Rupees ten and fifty paise only"));
  it("rejects fractional paise", () => expect(() => amountInWords(10.5)).toThrow(RangeError));
});

describe("formatAmount", () => {
  it("uses Indian grouping", () => expect(formatAmount(1_23_456_00)).toBe("1,23,456"));
  it("shows paise only when present", () => expect(formatAmount(10_50)).toBe("10.50"));
});

describe("splitByPercent", () => {
  it("splits evenly", () => expect(splitByPercent(18_000_00, [50, 50])).toEqual([9_000_00, 9_000_00]));
  it("gives the remainder to the last part", () => {
    const parts = splitByPercent(10_001, [50, 40, 10]);
    expect(parts).toEqual([5000, 4000, 1001]);
    expect(parts.reduce((a, b) => a + b)).toBe(10_001);
  });
  it("requires 100%", () => expect(() => splitByPercent(100, [50, 40])).toThrow(RangeError));
});

describe("lineAmount", () => {
  it("rounds to the nearest paisa", () => expect(lineAmount(1.5, 333)).toBe(500));
});
