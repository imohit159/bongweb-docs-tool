import { z } from "zod";
import { isIsoDay } from "@/lib/dates";

// Shared zod fragments for proposal content. Draft content is lenient (blank
// strings are fine); completeness is checked by each template's findMissingFields.

export const text = (max: number) => z.string().max(max);

export const isoDayOrBlank = z.string().refine((value) => value === "" || isIsoDay(value), "Invalid date");

export const clientSchema = z
  .object({
    name: text(120),
    business: text(160),
    city: text(80),
    phone: text(40),
    email: text(160),
  })
  .strict();
export type ClientDetails = z.infer<typeof clientSchema>;

export const EMPTY_CLIENT: ClientDetails = { name: "", business: "", city: "", phone: "", email: "" };

export const lineItemSchema = z
  .object({
    id: z.string().min(1).max(40),
    description: text(300),
    qty: z.number().min(0).max(100_000),
    ratePaise: z.number().int().min(0).max(1_000_000_000_00),
  })
  .strict();
export type LineItem = z.infer<typeof lineItemSchema>;

export const MAX_LINE_ITEMS = 50;

/** Overrides for a template's fixed wording, keyed by that template's wording ids. */
export function wordingOverridesSchema<K extends string>(keys: readonly [K, ...K[]]) {
  return z.partialRecord(z.enum(keys), text(1000));
}

export interface WordingDefinition {
  label: string;
  text: string;
}

export const rowId = z.string().min(1).max(40);

export function newRowId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** A bullet list: problems, goals, highlights, reasons, exclusions, terms. */
export const listSchema = (maxItems = 12, maxLength = 300) =>
  z.array(z.object({ id: rowId, text: text(maxLength) }).strict()).max(maxItems);
export type ListItem = { id: string; text: string };

export const listOf = (...texts: string[]): ListItem[] => texts.map((t) => ({ id: newRowId(), text: t }));

export const filledItems = <T extends { text: string }>(items: readonly T[]) =>
  items.filter((item) => item.text.trim());

// Plans run Premium → Standard → Basic in the documents, highest first.
export const PLAN_TIERS = ["premium", "standard", "basic"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];
export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  premium: "Premium",
  standard: "Standard",
  basic: "Basic",
};

const tierValues = <T extends z.ZodType>(value: T) =>
  z.object({ premium: value, standard: value, basic: value }).strict();

export const planComparisonSchema = z
  .object({
    /** "single": one fixed price, only the Standard column is printed. */
    mode: z.enum(["plans", "single"]),
    recommended: z.enum(PLAN_TIERS),
    rows: z.array(z.object({ id: rowId, label: text(80), values: tierValues(text(200)) }).strict()).max(15),
    pricePaise: tierValues(z.number().int().min(0).max(1_000_000_000_00)),
  })
  .strict();
export type PlanComparison = z.infer<typeof planComparisonSchema>;

export function planRows(...labels: string[]): PlanComparison["rows"] {
  return labels.map((label) => ({ id: newRowId(), label, values: { premium: "", standard: "", basic: "" } }));
}

/** Tiers that are printed: all three, or only Standard for a single price. */
export function visibleTiers(plans: PlanComparison): readonly PlanTier[] {
  return plans.mode === "single" ? ["standard"] : PLAN_TIERS;
}

/** The price that drives the payment schedule: the recommended plan, or the single price. */
export function headlinePrice(plans: PlanComparison): number {
  return plans.pricePaise[plans.mode === "single" ? "standard" : plans.recommended];
}
