import { z } from "zod";
import { addDays } from "@/lib/dates";
import {
  EMPTY_CLIENT,
  PLAN_TIER_LABELS,
  clientSchema,
  filledItems,
  headlinePrice,
  isoDayOrBlank,
  listOf,
  listSchema,
  newRowId,
  planComparisonSchema,
  planRows,
  rowId,
  text,
  visibleTiers,
  wordingOverridesSchema,
  type WordingDefinition,
} from "../schema";
import type { MissingField, ProposalTemplate } from "./types";

// Mirrors docs/proposal-templates-v3/pdf/03-retainer-proposal.pdf.

export const RETAINER_VALIDITY_DAYS = 15;
export const DEFAULT_MINIMUM_TERM_MONTHS = 3;
export const DEFAULT_FEE_DUE_DAY = 5;

export const RETAINER_SECTIONS = [
  { id: "details", label: "Details" },
  { id: "client", label: "Client" },
  { id: "summary", label: "Summary" },
  { id: "deliverables", label: "Monthly deliverables" },
  { id: "plans", label: "Plans" },
  { id: "reporting", label: "Reporting" },
  { id: "notIncluded", label: "Not included" },
  { id: "nextSteps", label: "Next steps" },
  { id: "terms", label: "Terms" },
] as const;
export type RetainerSection = (typeof RETAINER_SECTIONS)[number]["id"];

export const RETAINER_WORDING = {
  unusedNote: {
    label: "After deliverables",
    text: "Unused deliverables do not carry over to the next month.",
  },
  aboutResults: {
    label: "About results",
    text: "We commit to the agreed deliverables and quality. Leads, sales and follower growth also depend on your offer, audience and market, so they are not guaranteed.",
  },
  nextStep1: { label: "Next step 1", text: "Review this proposal and choose a plan." },
  nextStep2: { label: "Next step 2", text: "Sign below or reply “Approved” on WhatsApp or email." },
  nextStep3: { label: "Next step 3", text: "Pay the first month’s fee." },
} as const satisfies Record<string, WordingDefinition>;
export type RetainerWordingKey = keyof typeof RETAINER_WORDING;
const WORDING_KEYS = Object.keys(RETAINER_WORDING) as [RetainerWordingKey, ...RetainerWordingKey[]];

/** Terms after the two generated from the fee day and minimum term. */
export const DEFAULT_RETAINER_TERMS = [
  "Prices are in Indian Rupees. GST is not applicable: Bongweb Studio is not registered under GST.",
  "Revision rounds are as listed; extra work is quoted separately.",
  "Third-party costs (ad spend, paid tools, stock media) are paid by you directly.",
];

export const retainerContentSchema = z
  .object({
    issueDate: isoDayOrBlank,
    validUntil: isoDayOrBlank,
    client: clientSchema,
    summary: text(1200),
    startDate: isoDayOrBlank,
    minimumTermMonths: z.number().int().min(1).max(36),
    deliverables: z.array(z.object({ id: rowId, item: text(200), perMonth: text(40) }).strict()).max(15),
    whyApproach: text(1200),
    plans: planComparisonSchema,
    reporting: z.object({ frequency: text(40), description: text(600) }).strict(),
    notIncluded: listSchema(10),
    onboardingDate: isoDayOrBlank,
    feeDueDay: z.number().int().min(1).max(28),
    terms: listSchema(12, 400),
    wording: wordingOverridesSchema(WORDING_KEYS),
  })
  .strict();
export type RetainerContent = z.infer<typeof retainerContentSchema>;

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/** The two terms built from fields, printed before the editable ones. */
export function generatedRetainerTerms(content: RetainerContent): string[] {
  return [
    `The fee is paid in advance by the ${ordinal(content.feeDueDay)} of each month. Work for a month starts once that month’s fee is received.`,
    `Minimum term of ${content.minimumTermMonths} ${content.minimumTermMonths === 1 ? "month" : "months"}; after that, either side can stop with 30 days’ written notice.`,
  ];
}

function findMissingFields(content: RetainerContent): MissingField<RetainerSection>[] {
  const missing: MissingField<RetainerSection>[] = [];
  const need = (section: RetainerSection, path: string, label: string, value: string) => {
    if (!value.trim()) missing.push({ section, path, label });
  };
  need("details", "issueDate", "Date", content.issueDate);
  need("details", "validUntil", "Valid until", content.validUntil);
  need("client", "client.name", "Client name", content.client.name);
  need("client", "client.business", "Business name", content.client.business);
  need("summary", "summary", "Summary", content.summary);
  need("summary", "startDate", "Start date", content.startDate);
  if (filledItems(content.deliverables.map((d) => ({ text: d.item }))).length === 0)
    missing.push({ section: "deliverables", path: "deliverables", label: "At least one deliverable" });
  content.deliverables.forEach((d, i) => {
    if (d.item.trim())
      need("deliverables", `deliverables.${i}.perMonth`, `Deliverable ${i + 1}: per month`, d.perMonth);
  });
  need("deliverables", "whyApproach", "Why this approach", content.whyApproach);
  for (const tier of visibleTiers(content.plans)) {
    if (content.plans.pricePaise[tier] <= 0)
      missing.push({
        section: "plans",
        path: `plans.pricePaise.${tier}`,
        label: `${PLAN_TIER_LABELS[tier]} monthly fee`,
      });
  }
  need("reporting", "reporting.description", "What the report covers", content.reporting.description);
  need("nextSteps", "onboardingDate", "Onboarding call date", content.onboardingDate);
  return missing;
}

export const retainerTemplate: ProposalTemplate<RetainerContent, RetainerSection> = {
  type: "retainer",
  sections: RETAINER_SECTIONS,
  contentSchema: retainerContentSchema,
  createDefaultContent: (today) => ({
    issueDate: today,
    validUntil: addDays(today, RETAINER_VALIDITY_DAYS),
    client: { ...EMPTY_CLIENT },
    summary: "",
    startDate: "",
    minimumTermMonths: DEFAULT_MINIMUM_TERM_MONTHS,
    deliverables: [
      { id: newRowId(), item: "", perMonth: "" },
      { id: newRowId(), item: "Content calendar for the month", perMonth: "1" },
      { id: newRowId(), item: "Monthly report", perMonth: "1" },
      { id: newRowId(), item: "Revisions per deliverable", perMonth: "1 round" },
    ],
    whyApproach: "",
    plans: {
      mode: "plans",
      recommended: "standard",
      rows: planRows("Best for", "Deliverables", "Platforms", "Reporting"),
      pricePaise: { premium: 0, standard: 0, basic: 0 },
    },
    reporting: { frequency: "month", description: "" },
    notIncluded: listOf("Paid ad spend", "Photo or video shoots"),
    onboardingDate: "",
    feeDueDay: DEFAULT_FEE_DUE_DAY,
    terms: listOf(...DEFAULT_RETAINER_TERMS),
    wording: {},
  }),
  findMissingFields,
  prepareRevision: (content, today) => ({
    ...content,
    issueDate: today,
    validUntil: addDays(today, RETAINER_VALIDITY_DAYS),
  }),
  summarize: (content) => {
    const fee = headlinePrice(content.plans);
    return {
      title: content.summary.split("\n")[0].slice(0, 120).trim(),
      clientName: content.client.business.trim() || content.client.name.trim(),
      issueDate: content.issueDate || null,
      // Retainers list their monthly fee as the total.
      totalPaise: fee > 0 ? fee : null,
    };
  },
};
