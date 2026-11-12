import "server-only";

import { eq, sql } from "drizzle-orm";
import { auditInsertFrom } from "@/features/audit/service";
import { db } from "@/server/db/client";
import { studioSettings } from "@/server/db/schema";
import { EMPTY_STUDIO_DETAILS, studioDetailsSchema, type StudioDetails } from "./schema";

export async function getStudioDetails(): Promise<StudioDetails> {
  const [row] = await db.select().from(studioSettings).where(eq(studioSettings.id, 1));
  if (!row) return EMPTY_STUDIO_DETAILS;
  // Tolerate fields added after the row was saved.
  return studioDetailsSchema.parse({ ...EMPTY_STUDIO_DETAILS, ...row.content });
}

export async function saveStudioDetails(details: StudioDetails, actorUserId: string): Promise<void> {
  const content = JSON.stringify(studioDetailsSchema.parse(details));
  await db.execute(sql`
    with saved as (
      insert into studio_settings (id, content, updated_by, updated_at)
      values (1, ${content}::jsonb, ${actorUserId}, now())
      on conflict (id) do update
        set content = excluded.content, updated_by = excluded.updated_by, updated_at = now()
      returning null::uuid as id
    )
    ${auditInsertFrom(sql`saved`, actorUserId, "studio_settings.updated", "studio_settings")}
  `);
}
