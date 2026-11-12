"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/service";
import { PROPOSAL_STATUSES, PROPOSAL_TYPES } from "./domain";
import {
  changeProposalStatus,
  createProposal,
  reviseProposal,
  saveProposalContent,
  type MutationResult,
} from "./service";
import { isAvailableProposalType } from "./templates";

// Server Actions are public POST endpoints: each one authenticates and
// validates its own input.

type ActionResult<T> = MutationResult<T> | { ok: false; error: "unauthorized" };

const id = z.uuid();

async function requireActorId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function createProposalAction(type: unknown): Promise<ActionResult<{ id: string }>> {
  const actorId = await requireActorId();
  if (!actorId) return { ok: false, error: "unauthorized" };
  const parsed = z.enum(PROPOSAL_TYPES).safeParse(type);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!isAvailableProposalType(parsed.data)) return { ok: false, error: "unavailable" };
  const result = await createProposal(parsed.data, actorId);
  if (result.ok) revalidatePath("/proposals");
  return result;
}

const saveInput = z.object({ id, rowVersion: z.number().int().positive(), content: z.unknown() });

export async function saveProposalAction(input: unknown): Promise<ActionResult<{ rowVersion: number }>> {
  const actorId = await requireActorId();
  if (!actorId) return { ok: false, error: "unauthorized" };
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return saveProposalContent({ ...parsed.data, actorUserId: actorId });
}

const statusInput = z.object({ id, to: z.enum(PROPOSAL_STATUSES) });

export async function changeProposalStatusAction(input: unknown) {
  const actorId = await requireActorId();
  if (!actorId) return { ok: false as const, error: "unauthorized" as const };
  const parsed = statusInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };
  const result = await changeProposalStatus({ ...parsed.data, actorUserId: actorId });
  if (result.ok) revalidatePath("/proposals");
  return result;
}

export async function reviseProposalAction(proposalId: unknown): Promise<ActionResult<{ id: string }>> {
  const actorId = await requireActorId();
  if (!actorId) return { ok: false, error: "unauthorized" };
  const parsed = id.safeParse(proposalId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const result = await reviseProposal(parsed.data, actorId);
  if (result.ok) revalidatePath("/proposals");
  return result;
}
