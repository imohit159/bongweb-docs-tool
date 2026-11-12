import { z } from "zod";
import { addDays } from "@/lib/dates";
import { lineAmount, splitByPercent } from "@/lib/money";
import {
  EMPTY_CLIENT,
  MAX_LINE_ITEMS,
  clientSchema,
  isoDayOrBlank,
  lineItemSchema,
  text,
  wordingOverridesSchema,
  type LineItem,
  type WordingDefinition,
} from "../schema";
import type { MissingField, ProposalTemplate } from "./types";

// Mirrors docs/proposal-templates-v3/pdf/01-quick-quote.pdf.

export const QUOTATION_VALIDITY_DAYS = 15;
export const QUOTATION_PAYMENT_PERCENTS = [50, 50] as const;

export const QUOTATION_SECTIONS = [
  { id: "details", label: "Details" },
  { id: "client", label: "Client" },
  { id: "work", label: "The work" },
  { id: "price", label: "Price" },
  { id: "timeline", label: "Timeline" },
  { id: "payment", label: "Payment" },
  { id: "acceptance", label: "Acceptance" },
] as const;
export type QuotationSection = (typeof QUOTATION_SECTIONS)[number]["id"];

export const QUOTATION_WORDING = {
  notIncludedSuffix: { label: "After “Not included”", text: "Any other work is quoted separately." },
  advanceWhen: { label: "Advance: when", text: "before work starts" },
  balanceWhen: { label: "Balance: when", text: "on delivery, before final files are handed over" },
  startNote: { label: "Start date note", text: "(after advance)" },
  toAccept: {
    label: "To accept",
    text: "Reply “Approved” on WhatsApp or email, or sign below. Work begins once the advance is received.",
  },
} as const satisfies Record<string, WordingDefinition>;
export type QuotationWordingKey = keyof typeof QUOTATION_WORDING;
const WORDING_KEYS = Object.keys(QUOTATION_WORDING) as [QuotationWordingKey, ...QuotationWordingKey[]];

export const quotationContentSchema = z
  .object({
    issueDate: isoDayOrBlank,
    validUntil: isoDayOrBlank,
    client: clientSchema,
    work: z
      .object({
        description: text(1200),
        included: text(600),
        notIncluded: text(600),
      })
      .strict(),
    items: z.array(lineItemSchema).max(MAX_LINE_ITEMS),
    timeline: z
      .object({
        start: isoDayOrBlank,
        delivery: isoDayOrBlank,
        weNeed: text(400),
      })
      .strict(),
    wording: wordingOverridesSchema(WORDING_KEYS),
  })
  .strict();
export type QuotationContent = z.infer<typeof quotationContentSchema>;

export function itemsTotal(items: readonly LineItem[]): number {
  return items.reduce((sum, item) => sum + lineAmount(item.qty, item.ratePaise), 0);
}

export function quotationPayment(content: QuotationContent): { advance: number; balance: number } {
  const [advance, balance] = splitByPercent(itemsTotal(content.items), QUOTATION_PAYMENT_PERCENTS);
  return { advance, balance };
}

export function newLineItemId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function findMissingFields(content: QuotationContent): MissingField<QuotationSection>[] {
  const missing: MissingField<QuotationSection>[] = [];
  const need = (section: QuotationSection, path: string, label: string, value: string) => {
    if (!value.trim()) missing.push({ section, path, label });
  };
  need("details", "issueDate", "Date", content.issueDate);
  need("details", "validUntil", "Valid until", content.validUntil);
  need("client", "client.name", "Client name", content.client.name);
  need("client", "client.business", "Business name", content.client.business);
  need("work", "work.description", "What we will do", content.work.description);
  need("work", "work.included", "Included", content.work.included);
  need("work", "work.notIncluded", "Not included", content.work.notIncluded);
  if (content.items.length === 0)
    missing.push({ section: "price", path: "items", label: "At least one item" });
  content.items.forEach((item, index) => {
    need("price", `items.${index}.description`, `Item ${index + 1} description`, item.description);
    if (item.qty <= 0)
      missing.push({ section: "price", path: `items.${index}.qty`, label: `Item ${index + 1} qty` });
    if (item.ratePaise <= 0)
      missing.push({ section: "price", path: `items.${index}.ratePaise`, label: `Item ${index + 1} rate` });
  });
  need("timeline", "timeline.start", "Start date", content.timeline.start);
  need("timeline", "timeline.delivery", "Delivery date", content.timeline.delivery);
  need("timeline", "timeline.weNeed", "We need from you", content.timeline.weNeed);
  return missing;
}

export const quotationTemplate: ProposalTemplate<QuotationContent, QuotationSection> = {
  type: "quotation",
  sections: QUOTATION_SECTIONS,
  contentSchema: quotationContentSchema,
  createDefaultContent: (today) => ({
    issueDate: today,
    validUntil: addDays(today, QUOTATION_VALIDITY_DAYS),
    client: { ...EMPTY_CLIENT },
    work: { description: "", included: "", notIncluded: "" },
    items: [{ id: newLineItemId(), description: "", qty: 1, ratePaise: 0 }],
    timeline: { start: "", delivery: "", weNeed: "" },
    wording: {},
  }),
  findMissingFields,
  prepareRevision: (content, today) => ({
    ...content,
    issueDate: today,
    validUntil: addDays(today, QUOTATION_VALIDITY_DAYS),
  }),
  summarize: (content) => ({
    title: content.work.description.split("\n")[0].slice(0, 120).trim(),
    clientName: content.client.business.trim() || content.client.name.trim(),
    issueDate: content.issueDate || null,
    totalPaise: content.items.length ? itemsTotal(content.items) : null,
  }),
};
