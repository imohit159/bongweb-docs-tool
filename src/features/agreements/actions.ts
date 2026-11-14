"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/service";
import { PLAN_TIERS } from "@/features/proposals/schema";
import { AGREEMENT_STATUSES } from "./domain";
import { changeAgreementStatus, createAgreement, saveAgreement } from "./service";

const createInput = z.object({ proposalId: z.uuid(), tier: z.enum(PLAN_TIERS) }).strict();
const saveInput = z
  .object({ id: z.uuid(), rowVersion: z.number().int().positive(), content: z.unknown() })
  .strict();
const statusInput = z
  .object({ id: z.uuid(), rowVersion: z.number().int().positive(), to: z.enum(AGREEMENT_STATUSES) })
  .strict();
export async function createAgreementAction(input: unknown) {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false as const, error: "unauthorized" as const };
  const parsed = createInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };
  const result = await createAgreement(parsed.data.proposalId, parsed.data.tier, actor.id);
  if (result.ok) revalidatePath("/agreements");
  return result;
}
export async function saveAgreementAction(input: unknown) {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false as const, error: "unauthorized" as const };
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };
  const result = await saveAgreement(parsed.data, actor.id);
  if (result.ok) revalidatePath("/agreements");
  return result;
}
export async function changeAgreementStatusAction(input: unknown) {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false as const, error: "unauthorized" as const };
  const parsed = statusInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };
  const result = await changeAgreementStatus(parsed.data, actor.id);
  if (result.ok) revalidatePath("/agreements");
  return result;
}
