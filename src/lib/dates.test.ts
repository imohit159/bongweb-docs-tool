import { describe, expect, it } from "vitest";
import { addDays, formatDocDate, isIsoDay, todayIst } from "./dates";

describe("dates", () => {
  it("formats document dates", () => {
    expect(formatDocDate("2026-11-12")).toBe("12 Nov 2026");
    expect(formatDocDate("2026-09-03")).toBe("03 Sep 2026");
  });
  it("adds days across months and years", () => {
    expect(addDays("2026-12-25", 15)).toBe("2027-01-09");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("validates ISO days", () => {
    expect(isIsoDay("2026-02-30")).toBe(false);
    expect(isIsoDay("12-11-2026")).toBe(false);
    expect(isIsoDay("2026-11-12")).toBe(true);
  });
  it("uses IST for today", () => {
    // 20:00 UTC on 11 Nov is 01:30 on 12 Nov in IST.
    expect(todayIst(new Date("2026-11-11T20:00:00Z"))).toBe("2026-11-12");
  });
});
