"use server";

import { getCurrentUser } from "@/features/auth/service";
import { studioDetailsSchema, type StudioDetails } from "./schema";
import { saveStudioDetails } from "./service";

export async function saveStudioDetailsAction(
  input: unknown,
): Promise<{ ok: true; value: StudioDetails } | { ok: false; error: "unauthorized" | "invalid" }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const parsed = studioDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await saveStudioDetails(parsed.data, user.id);
  return { ok: true, value: parsed.data };
}
