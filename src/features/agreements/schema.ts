import { z } from "zod";
import { clientSchema, isoDayOrBlank, text } from "@/features/proposals/schema";
import { AGREEMENT_TYPES } from "./domain";

export const CLAUSE_IDS = [
  "start",
  "approvals",
  "extra",
  "support",
  "payment",
  "tax",
  "ownership",
  "licences",
  "confidentiality",
  "portfolio",
  "termination",
  "breach",
  "responsibility",
  "liability",
  "disputes",
  "notices",
  "acceptance",
] as const;
export type ClauseId = (typeof CLAUSE_IDS)[number];
export const agreementContentSchema = z
  .object({
    type: z.enum(AGREEMENT_TYPES),
    issueDate: isoDayOrBlank,
    title: text(160),
    proposal: z.object({ id: z.uuid(), number: text(40), date: isoDayOrBlank, option: text(80) }).strict(),
    feePaise: z.number().int().min(0).max(100_000_000_000),
    client: clientSchema
      .extend({ address: text(300), role: text(80), email: z.union([z.literal(""), z.email().max(160)]) })
      .strict(),
    provider: z
      .object({
        legalName: text(120),
        address: text(300),
        email: z.union([z.literal(""), z.email().max(160)]),
        role: text(80),
      })
      .strict(),
    startDate: isoDayOrBlank,
    deliveryDate: isoDayOrBlank,
    minimumTermMonths: z.number().int().min(1).max(36),
    feeDueDay: z.number().int().min(1).max(28),
    jurisdiction: text(100),
    clientSignDate: isoDayOrBlank,
    providerSignDate: isoDayOrBlank,
    wording: z.partialRecord(z.enum(CLAUSE_IDS), text(1600)),
  })
  .strict();
export type AgreementContent = z.infer<typeof agreementContentSchema>;
