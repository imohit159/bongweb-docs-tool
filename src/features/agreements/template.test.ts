import { fixture } from "./test-fixtures";
import { describe, expect, it } from "vitest";
import { agreementContentSchema } from "./schema";
import {
  agreementClauseGroups,
  findMissingAgreementFieldDetails,
  findMissingAgreementFields,
} from "./template";
import { AGREEMENT_TRANSITIONS, formatAgreementNumber } from "./domain";

describe("agreements", () => {
  it("copies the selected price and exact proposal revision without sharing mutable data", () => {
    const c = fixture("project");
    expect(c.proposal.number).toBe("BW-P-012 v2");
    expect(c.feePaise).toBe(3000000);
    expect(agreementContentSchema.safeParse(c).success).toBe(true);
    expect(findMissingAgreementFields(c)).toEqual([]);
    expect(formatAgreementNumber(2)).toBe("BW-SA-002");
  });
  it.each(["project", "retainer"] as const)("assigns missing %s fields to their editor sections", (type) => {
    const c = fixture(type);
    expect(findMissingAgreementFieldDetails(c)).toEqual([]);
    c.client.address = " ";
    c.jurisdiction = "";
    c.deliveryDate = "";
    c.startDate = "";
    c.feePaise = 0;
    expect(findMissingAgreementFieldDetails(c)).toEqual([
      { section: "details", label: "Client address" },
      { section: "ending", label: "Jurisdiction" },
      { section: "work", label: type === "project" ? "Estimated delivery" : "Start date" },
      { section: "payment", label: "Agreed fee" },
    ]);
    c.client.address = "Kolkata";
    expect(findMissingAgreementFieldDetails(c).some((field) => field.section === "details")).toBe(false);
  });
  it("retains retainer-specific terms and overrides independently", () => {
    const c = fixture("retainer");
    c.minimumTermMonths = 6;
    c.wording.portfolio = "Keep all work private.";
    const groups = agreementClauseGroups(c);
    expect(groups.find((g) => g.id === "ending")!.clauses[0].text).toContain("6 months");
    expect(groups.find((g) => g.id === "ownership")!.clauses.at(-1)!.text).toBe("Keep all work private.");
    expect(groups.find((g) => g.id === "work")!.clauses[0].text).toContain("01 Dec 2026");
  });
  it("rejects invalid calendar dates, money, email, and unknown clauses", () => {
    const c = fixture("project");
    for (const patch of [
      { issueDate: "2026-02-30" },
      { feePaise: -1 },
      { feePaise: 1.5 },
      { minimumTermMonths: 0 },
      { wording: { unknown: "term" } },
      { client: { ...c.client, email: "invalid" } },
    ])
      expect(agreementContentSchema.safeParse({ ...c, ...patch }).success).toBe(false);
  });
  it("requires actual party details before sending and locks signed agreements", () => {
    const c = fixture("project");
    c.provider.legalName = "";
    c.client.address = "";
    c.jurisdiction = "";
    expect(findMissingAgreementFields(c)).toEqual(
      expect.arrayContaining(["Provider legal name", "Client address", "Jurisdiction"]),
    );
    expect(AGREEMENT_TRANSITIONS.signed).toEqual([]);
    expect(AGREEMENT_TRANSITIONS.sent).toContain("draft");
  });
});
