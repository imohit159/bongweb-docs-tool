import { describe, expect, it } from "vitest";
import { EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import { listOf } from "../schema";
import { PROPOSAL_TEMPLATES, getProposalTemplate, type AvailableProposalType } from ".";
import { changeTemplate } from "./change";
import { projectPayment, projectTemplate } from "./project";
import { generatedRetainerTerms, ordinal, retainerTemplate } from "./retainer";

const TODAY = "2026-11-13";
const studio = { ...EMPTY_STUDIO_DETAILS, signatoryName: "Mohit Kumar", phone: "+91 90000 00000" };

describe("every template", () => {
  for (const type of Object.keys(PROPOSAL_TEMPLATES) as AvailableProposalType[]) {
    const template = getProposalTemplate(type);
    it(`${type}: defaults validate, are incomplete, and survive a revision`, () => {
      const content = template.createDefaultContent(TODAY, studio);
      expect(template.contentSchema.safeParse(content).success).toBe(true);
      expect(template.findMissingFields(content).length).toBeGreaterThan(0);
      const sectionIds = new Set(template.sections.map((s) => s.id));
      for (const field of template.findMissingFields(content))
        expect(sectionIds.has(field.section)).toBe(true);
      const revised = template.prepareRevision(content, "2026-12-01");
      expect(template.contentSchema.safeParse(revised).success).toBe(true);
      expect(template.summarize(revised).issueDate).toBe("2026-12-01");
    });
  }
});

describe("project proposal", () => {
  const base = () => projectTemplate.createDefaultContent(TODAY, studio);

  it("prefills prepared by and contact from studio details", () => {
    const content = base();
    expect(content.preparedBy).toBe("Mohit Kumar");
    expect(content.contact.phone).toBe("+91 90000 00000");
  });

  it("splits the recommended plan 50/40/10", () => {
    const content = base();
    content.investment.pricePaise = { premium: 50_000_00, standard: 30_000_01, basic: 15_000_00 };
    const { total, milestones } = projectPayment(content);
    expect(total).toBe(30_000_01);
    expect(milestones.map((m) => m.amount)).toEqual([15_000_00, 12_000_00, 3_000_01]);
  });

  it("uses only the standard price in single-price mode", () => {
    const content = base();
    content.investment.mode = "single";
    content.investment.recommended = "premium";
    content.investment.pricePaise = { premium: 0, standard: 40_000_00, basic: 0 };
    expect(projectPayment(content).total).toBe(40_000_00);
    const priceGaps = projectTemplate
      .findMissingFields(content)
      .filter((m) => m.path.startsWith("investment"));
    expect(priceGaps).toEqual([]);
    expect(projectTemplate.summarize(content).totalPaise).toBe(40_000_00);
  });

  it("flags empty lists only when no item has text", () => {
    const content = base();
    content.problems = listOf("", "Bookings only by phone");
    expect(projectTemplate.findMissingFields(content).some((m) => m.path === "problems")).toBe(false);
  });
});

describe("retainer proposal", () => {
  it("builds the fee and minimum-term terms from fields", () => {
    const content = retainerTemplate.createDefaultContent(TODAY, studio);
    content.feeDueDay = 1;
    content.minimumTermMonths = 6;
    const [fee, term] = generatedRetainerTerms(content);
    expect(fee).toContain("by the 1st of each month");
    expect(term).toContain("Minimum term of 6 months");
  });

  it("formats ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 28].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "28th",
    ]);
  });

  it("lists the monthly fee as the total", () => {
    const content = retainerTemplate.createDefaultContent(TODAY, studio);
    content.plans.pricePaise.standard = 25_000_00;
    expect(retainerTemplate.summarize(content).totalPaise).toBe(25_000_00);
  });
});

describe("change request", () => {
  it("links to the original proposal only when picked", () => {
    const content = changeTemplate.createDefaultContent(TODAY, studio);
    expect(changeTemplate.linkedProposalId?.(content)).toBeNull();
    content.original.proposalId = "257dc61f-cab5-40bc-87a8-926c5c79deff";
    expect(changeTemplate.linkedProposalId?.(content)).toBe("257dc61f-cab5-40bc-87a8-926c5c79deff");
  });

  it("rejects a malformed original proposal id", () => {
    const content = changeTemplate.createDefaultContent(TODAY, studio);
    content.original.proposalId = "not-a-uuid";
    expect(changeTemplate.contentSchema.safeParse(content).success).toBe(false);
  });
});
