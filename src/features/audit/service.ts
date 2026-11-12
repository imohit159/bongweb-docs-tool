import "server-only";

import { sql, type SQL } from "drizzle-orm";

// Audit rows are written in the same statement as the change they record, so
// an event exists exactly when the change committed. Callers embed this
// fragment as the final INSERT of a CTE chain whose `source` CTE yields `id`.

export type AuditAction =
  "proposal.created" | "proposal.status_changed" | "proposal.revised" | "studio_settings.updated";

export function auditInsertFrom(
  source: SQL,
  actorUserId: string,
  action: AuditAction,
  entityType: string,
  metadata: Record<string, unknown> = {},
): SQL {
  return sql`insert into audit_events (actor_user_id, action, entity_type, entity_id, metadata)
    select ${actorUserId}, ${action}, ${entityType}, id, ${JSON.stringify(metadata)}::jsonb from ${source}`;
}
