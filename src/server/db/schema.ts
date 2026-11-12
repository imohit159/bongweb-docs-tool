import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_TYPES,
  type ProposalStatus,
  type ProposalType,
} from "@/features/proposals/domain";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Managed identity IDs stay opaque; audit history survives account deletion.
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("audit_events_action_nonblank", sql`length(btrim(${table.action})) > 0`),
    check("audit_events_entity_type_nonblank", sql`length(btrim(${table.entityType})) > 0`),
    check("audit_events_metadata_object", sql`jsonb_typeof(${table.metadata}) = 'object'`),
    index("audit_events_occurred_at_idx").on(table.occurredAt),
    index("audit_events_entity_idx").on(table.entityType, table.entityId, table.occurredAt),
    index("audit_events_actor_idx").on(table.actorUserId, table.occurredAt),
  ],
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;

const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").$type<ProposalType>().notNull(),
    sequence: integer("sequence").notNull(),
    version: integer("version").default(1).notNull(),
    status: text("status").$type<ProposalStatus>().default("draft").notNull(),
    // Denormalised from `content` on every save, for the list and lookups.
    title: text("title").default("").notNull(),
    clientName: text("client_name").default("").notNull(),
    issueDate: date("issue_date", { mode: "string" }),
    totalPaise: bigint("total_paise", { mode: "number" }),
    replacesId: uuid("replaces_id").references((): AnyPgColumn => proposals.id, { onDelete: "restrict" }),
    originalProposalId: uuid("original_proposal_id").references((): AnyPgColumn => proposals.id, {
      onDelete: "restrict",
    }),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    // Optimistic concurrency for autosave: a save must name the version it edited.
    rowVersion: integer("row_version").default(1).notNull(),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("proposals_type_valid", sql`${table.type} in (${sqlList(PROPOSAL_TYPES)})`),
    check("proposals_status_valid", sql`${table.status} in (${sqlList(PROPOSAL_STATUSES)})`),
    check("proposals_sequence_positive", sql`${table.sequence} > 0`),
    check("proposals_version_positive", sql`${table.version} > 0`),
    check("proposals_total_nonnegative", sql`${table.totalPaise} is null or ${table.totalPaise} >= 0`),
    check("proposals_content_object", sql`jsonb_typeof(${table.content}) = 'object'`),
    unique("proposals_number_unique").on(table.type, table.sequence, table.version),
    index("proposals_status_type_idx").on(table.status, table.type),
    index("proposals_issue_date_idx").on(table.issueDate),
  ],
);

export const proposalCounters = pgTable(
  "proposal_counters",
  {
    type: text("type").$type<ProposalType>().primaryKey(),
    lastValue: integer("last_value").default(0).notNull(),
  },
  (table) => [check("proposal_counters_type_valid", sql`${table.type} in (${sqlList(PROPOSAL_TYPES)})`)],
);

export const studioSettings = pgTable(
  "studio_settings",
  {
    // Exactly one row: the studio's own details, shared by every document.
    id: smallint("id").default(1).primaryKey(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("studio_settings_singleton", sql`${table.id} = 1`),
    check("studio_settings_content_object", sql`jsonb_typeof(${table.content}) = 'object'`),
  ],
);

export type ProposalRow = typeof proposals.$inferSelect;
