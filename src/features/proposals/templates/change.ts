import { z } from "zod";
import {
  EMPTY_CLIENT,
  MAX_LINE_ITEMS,
  clientSchema,
  isoDayOrBlank,
  lineItemSchema,
  newRowId,
  text,
  wordingOverridesSchema,
  type WordingDefinition,
} from "../schema";
import { itemsTotal } from "./quotation";
import type { ClientDetails } from "../schema";
import type { MissingField, ProposalTemplate } from "./types";

/** An accepted Project Proposal a Change Request can amend (the picker's options). */
export interface AcceptedProject {
  id: string;
  number: string;
  projectName: string;
  issueDate: string | null;
  client: ClientDetails;
}

// Mirrors docs/proposal-templates-v3/pdf/04-change-request.pdf.

export const CHANGE_SECTIONS = [
  { id: "details", label: "Details" },
  { id: "original", label: "Original proposal" },
  { id: "change", label: "What's changing" },
  { id: "cost", label: "Cost" },
  { id: "timeline", label: "Timeline impact" },
  { id: "payment", label: "Payment and approval" },
] as const;
export type ChangeSection = (typeof CHANGE_SECTIONS)[number]["id"];

export const CHANGE_WORDING = {
  payment: {
    label: "Payment",
    text: "The full amount of this change request is paid before the change work starts. All other terms of the original proposal stay the same.",
  },
  approval: { label: "Approval", text: "Sign below or reply “Approved” on WhatsApp or email." },
} as const satisfies Record<string, WordingDefinition>;
export type ChangeWordingKey = keyof typeof CHANGE_WORDING;
const WORDING_KEYS = Object.keys(CHANGE_WORDING) as [ChangeWordingKey, ...ChangeWordingKey[]];

export const changeContentSchema = z
  .object({
    issueDate: isoDayOrBlank,
    client: clientSchema,
    projectName: text(160),
    original: z
      .object({
        /** Set when picked from accepted Project Proposals; blank for one made outside the app. */
        proposalId: z.union([z.literal(""), z.uuid()]),
        number: text(40),
        date: isoDayOrBlank,
      })
      .strict(),
    change: text(1200),
    items: z.array(lineItemSchema).max(MAX_LINE_ITEMS),
    timeline: z
      .object({
        extraTime: text(40),
        newDelivery: isoDayOrBlank,
        previousDelivery: isoDayOrBlank,
      })
      .strict(),
    wording: wordingOverridesSchema(WORDING_KEYS),
  })
  .strict();
export type ChangeContent = z.infer<typeof changeContentSchema>;

function findMissingFields(content: ChangeContent): MissingField<ChangeSection>[] {
  const missing: MissingField<ChangeSection>[] = [];
  const need = (section: ChangeSection, path: string, label: string, value: string) => {
    if (!value.trim()) missing.push({ section, path, label });
  };
  need("details", "issueDate", "Date", content.issueDate);
  need("original", "client.name", "Client name", content.client.name);
  need("original", "client.business", "Business name", content.client.business);
  need("original", "projectName", "Project name", content.projectName);
  need("original", "original.number", "Original proposal number", content.original.number);
  need("original", "original.date", "Original proposal date", content.original.date);
  need("change", "change", "What's changing", content.change);
  if (content.items.length === 0)
    missing.push({ section: "cost", path: "items", label: "At least one item" });
  content.items.forEach((item, index) => {
    need("cost", `items.${index}.description`, `Item ${index + 1} description`, item.description);
    if (item.qty <= 0)
      missing.push({ section: "cost", path: `items.${index}.qty`, label: `Item ${index + 1} qty` });
    if (item.ratePaise <= 0)
      missing.push({ section: "cost", path: `items.${index}.ratePaise`, label: `Item ${index + 1} rate` });
  });
  need("timeline", "timeline.extraTime", "Extra time", content.timeline.extraTime);
  need("timeline", "timeline.newDelivery", "New delivery date", content.timeline.newDelivery);
  need("timeline", "timeline.previousDelivery", "Previous delivery date", content.timeline.previousDelivery);
  return missing;
}

export const changeTemplate: ProposalTemplate<ChangeContent, ChangeSection> = {
  type: "change",
  sections: CHANGE_SECTIONS,
  contentSchema: changeContentSchema,
  createDefaultContent: (today) => ({
    issueDate: today,
    client: { ...EMPTY_CLIENT },
    projectName: "",
    original: { proposalId: "", number: "", date: "" },
    change: "",
    items: [{ id: newRowId(), description: "", qty: 1, ratePaise: 0 }],
    timeline: { extraTime: "", newDelivery: "", previousDelivery: "" },
    wording: {},
  }),
  findMissingFields,
  prepareRevision: (content, today) => ({ ...content, issueDate: today }),
  summarize: (content) => ({
    title: (content.projectName.trim() || content.change.split("\n")[0]).slice(0, 120).trim(),
    clientName: content.client.business.trim() || content.client.name.trim(),
    issueDate: content.issueDate || null,
    totalPaise: content.items.length ? itemsTotal(content.items) : null,
  }),
  linkedProposalId: (content) => content.original.proposalId || null,
};
