import { describe, expect, it } from "vitest";
import { canChangeStatus, canRevise, formatProposalNumber, isEditableStatus, isProposalType } from "./domain";

describe("formatProposalNumber", () => {
  it("pads the sequence and uses the type prefix", () => {
    expect(formatProposalNumber("quotation", 1)).toBe("BW-Q-001");
    expect(formatProposalNumber("change", 42)).toBe("BW-CR-042");
    expect(formatProposalNumber("retainer", 1234)).toBe("BW-R-1234");
  });

  it("appends the version only for revisions", () => {
    expect(formatProposalNumber("project", 1, 1)).toBe("BW-P-001");
    expect(formatProposalNumber("project", 1, 2)).toBe("BW-P-001 v2");
  });

  it("rejects non-positive or fractional numbers", () => {
    expect(() => formatProposalNumber("project", 0)).toThrow(RangeError);
    expect(() => formatProposalNumber("project", 1.5)).toThrow(RangeError);
    expect(() => formatProposalNumber("project", 1, 0)).toThrow(RangeError);
  });
});

describe("isProposalType", () => {
  it("accepts only known types", () => {
    expect(isProposalType("quotation")).toBe(true);
    expect(isProposalType("invoice")).toBe(false);
    expect(isProposalType("")).toBe(false);
  });
});

describe("status rules", () => {
  it("allows draft → sent → accepted and sent → draft", () => {
    expect(canChangeStatus("draft", "sent")).toBe(true);
    expect(canChangeStatus("sent", "accepted")).toBe(true);
    expect(canChangeStatus("sent", "draft")).toBe(true);
  });
  it("never sets replaced by hand or reopens accepted", () => {
    expect(canChangeStatus("sent", "replaced")).toBe(false);
    expect(canChangeStatus("accepted", "draft")).toBe(false);
    expect(canChangeStatus("draft", "accepted")).toBe(false);
  });
  it("edits drafts only and revises sent/accepted", () => {
    expect(isEditableStatus("draft")).toBe(true);
    expect(isEditableStatus("sent")).toBe(false);
    expect(canRevise("accepted")).toBe(true);
    expect(canRevise("draft")).toBe(false);
  });
});
