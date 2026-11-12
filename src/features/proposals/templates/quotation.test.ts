import { describe, expect, it } from "vitest";
import { EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import {
  itemsTotal,
  quotationContentSchema,
  quotationPayment,
  quotationTemplate,
  type QuotationContent,
} from "./quotation";

const fresh = () => quotationTemplate.createDefaultContent("2026-11-12", EMPTY_STUDIO_DETAILS);

function complete(): QuotationContent {
  return {
    ...fresh(),
    client: { name: "Asha", business: "Lotus Salon", city: "Kolkata", phone: "", email: "" },
    work: { description: "One-page website", included: "2 revision rounds", notIncluded: "Hosting" },
    items: [
      { id: "a", description: "Website", qty: 1, ratePaise: 15_000_00 },
      { id: "b", description: "WhatsApp button", qty: 1, ratePaise: 3_000_01 },
    ],
    timeline: { start: "2026-11-20", delivery: "2026-12-04", weNeed: "Logo, photos" },
  };
}

describe("quotation template", () => {
  it("defaults validate and run 15 days", () => {
    const content = fresh();
    expect(quotationContentSchema.safeParse(content).success).toBe(true);
    expect(content.validUntil).toBe("2026-11-27");
  });

  it("rejects unknown keys and bad dates", () => {
    expect(quotationContentSchema.safeParse({ ...fresh(), extra: 1 }).success).toBe(false);
    expect(quotationContentSchema.safeParse({ ...fresh(), issueDate: "2026-02-30" }).success).toBe(false);
  });

  it("lists every blank required field by section", () => {
    const missing = quotationTemplate.findMissingFields(fresh());
    const sections = new Set(missing.map((m) => m.section));
    expect(sections).toEqual(new Set(["client", "work", "price", "timeline"]));
    expect(missing.map((m) => m.path)).toContain("items.0.ratePaise");
  });

  it("finds nothing missing when complete", () => {
    expect(quotationTemplate.findMissingFields(complete())).toEqual([]);
  });

  it("splits payment 50/50 with the remainder on the balance", () => {
    const content = complete();
    expect(itemsTotal(content.items)).toBe(18_000_01);
    expect(quotationPayment(content)).toEqual({ advance: 9_000_00, balance: 9_000_01 });
  });

  it("summarises for the list", () => {
    expect(quotationTemplate.summarize(complete())).toEqual({
      title: "One-page website",
      clientName: "Lotus Salon",
      issueDate: "2026-11-12",
      totalPaise: 18_000_01,
    });
  });
});
