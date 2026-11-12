import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import { listOf } from "../schema";
import { PROPOSAL_TEMPLATES, getProposalTemplate, type AvailableProposalType } from "../templates";
import type { ChangeContent } from "../templates/change";
import type { ProjectContent } from "../templates/project";
import type { RetainerContent } from "../templates/retainer";
import { documentFor } from "./render";
import { registerPdfFonts } from "./theme";

registerPdfFonts(resolve(__dirname, "../../../../public"));

const TODAY = "2026-11-13";
const studio = {
  ...EMPTY_STUDIO_DETAILS,
  address: "Salt Lake, Kolkata, West Bengal",
  phone: "+91 90000 00000",
  email: "hello@bongweb.in",
  website: "bongweb.in",
  upiId: "bongweb@okaxis",
  accountName: "Bongweb Studio",
  accountNumber: "000000000000",
  ifsc: "UTIB0000000",
  bankName: "Axis Bank",
  signatoryName: "Mohit Kumar",
  signatoryRole: "Founder",
};
const client = {
  name: "Asha Roy",
  business: "Lotus Salon",
  city: "Kolkata",
  phone: "+91 98300 00000",
  email: "asha@lotus.in",
};

function filledProject(): ProjectContent {
  const c = PROPOSAL_TEMPLATES.project.createDefaultContent(TODAY, studio);
  return {
    ...c,
    projectName: "Lotus Salon website",
    outcome: "A new website that brings Lotus Salon more bookings",
    client,
    summary:
      "Lotus Salon wants more bookings without more phone calls. We will build a fast, mobile-first website with online booking.",
    highlights: listOf(
      "Customers can book online 24/7",
      "A professional look that builds trust",
      "Live in 5 weeks",
    ),
    problems: listOf(
      "Bookings come only by phone and are missed after hours",
      "No website, so new customers can't find you on Google",
    ),
    goals: listOf("More bookings", "Be found on Google"),
    requirements: listOf("Works well on mobile", "Easy for staff to update prices"),
    solution: {
      approach: "A 5-page website with online booking and a WhatsApp button.",
      services: [
        {
          id: "s1",
          name: "Business Website",
          whatYouGet: "5-page website, contact form, Google Maps, WhatsApp button",
          revisions: "2 rounds",
          weNeed: "Logo, photos, page text, domain login",
          notIncluded: "Content writing, product photography",
        },
      ],
      whyApproach: "Most customers find salons on their phone; booking must take seconds.",
    },
    phases: c.phases.map((p, i) => ({
      ...p,
      what: [
        "Kick-off call, collect content",
        "Designs shared for your review",
        "Development and testing",
        "Go-live, handover, walkthrough",
      ][i],
      duration: ["Week 1", "Week 2–3", "Week 3–4", "Week 5"][i],
    })),
    investment: {
      ...c.investment,
      rows: c.investment.rows.map((r, i) => ({
        ...r,
        values:
          i === 0
            ? { premium: "Growing businesses", standard: "Most local businesses", basic: "New businesses" }
            : { premium: "8", standard: "5", basic: "3" },
      })),
      pricePaise: { premium: 50_000_00, standard: 30_000_00, basic: 15_000_00 },
    },
    thirdParty: c.thirdParty.map((t) => ({ ...t, costPaise: 1_000_00, paidTo: "GoDaddy" })),
    whyBongweb: listOf("One contact person from start to handover", "Local and responsive"),
    relevantWork: "Concept: Riverside Café website (bongweb.in/work/riverside).",
    kickoffDate: "2026-11-25",
  };
}

function filledRetainer(): RetainerContent {
  const c = PROPOSAL_TEMPLATES.retainer.createDefaultContent(TODAY, studio);
  return {
    ...c,
    client,
    summary: "Monthly social media management to keep your salon visible and bring in enquiries.",
    startDate: "2026-12-01",
    deliverables: [
      { id: "d0", item: "Social media posts and carousels with captions", perMonth: "12" },
      ...c.deliverables.slice(1),
    ],
    whyApproach: "Consistent posting builds trust over months, not weeks.",
    plans: { ...c.plans, pricePaise: { premium: 35_000_00, standard: 25_000_00, basic: 15_000_00 } },
    reporting: {
      frequency: "month",
      description: "a one-page report covering posts published, reach, engagement and next month’s plan",
    },
    onboardingDate: "2026-11-28",
  };
}

function filledChange(): ChangeContent {
  const c = PROPOSAL_TEMPLATES.change.createDefaultContent(TODAY, studio);
  return {
    ...c,
    client,
    projectName: "Lotus Salon website",
    original: { proposalId: "", number: "BW-P-001", date: "2026-11-03" },
    change: "Add an online booking page with payment, not part of the original scope.",
    items: [{ id: "i1", description: "Booking page with Razorpay payments", qty: 1, ratePaise: 8_000_00 }],
    timeline: { extraTime: "+7 days", newDelivery: "2026-12-15", previousDelivery: "2026-12-08" },
  };
}

const FILLED: Partial<Record<AvailableProposalType, () => unknown>> = {
  project: filledProject,
  retainer: filledRetainer,
  change: filledChange,
};

describe("PDF for every template", () => {
  for (const type of Object.keys(PROPOSAL_TEMPLATES) as AvailableProposalType[]) {
    it(`${type}: renders blank and filled`, async () => {
      const blank = getProposalTemplate(type).createDefaultContent(TODAY, EMPTY_STUDIO_DETAILS);
      const blankPdf = await renderToBuffer(
        documentFor({ type, number: "BW-X-001", content: blank, studio: EMPTY_STUDIO_DETAILS }),
      );
      expect(blankPdf.subarray(0, 5).toString()).toBe("%PDF-");
      const filled = FILLED[type]?.();
      if (filled) {
        const pdf = await renderToBuffer(
          documentFor({ type, number: "BW-X-001", content: filled as never, studio }),
        );
        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
        if (process.env.PDF_DIR) {
          writeFileSync(`${process.env.PDF_DIR}/${type}.pdf`, pdf);
          writeFileSync(`${process.env.PDF_DIR}/${type}-blank.pdf`, blankPdf);
        }
      }
    });
  }
});
