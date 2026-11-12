import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { auditInsertFrom } from "@/features/audit/service";
import { getStudioDetails } from "@/features/studio/service";
import { todayIst } from "@/lib/dates";
import { db } from "@/server/db/client";
import { proposals } from "@/server/db/schema";
import {
  PROPOSAL_STATUS_TRANSITIONS,
  formatProposalNumber,
  type ProposalStatus,
  type ProposalSummary,
} from "./domain";
import {
  getProposalTemplate,
  isAvailableProposalType,
  type AvailableProposalType,
  type ProposalContentByType,
} from "./templates";
import type { AcceptedProject } from "./templates/change";
import { projectContentSchema } from "./templates/project";

// Proposal use cases. Every multi-step write is a single SQL statement (CTE
// chain): neon-http has no interactive transactions, and one statement is atomic.

export interface ProposalDetail {
  id: string;
  type: AvailableProposalType;
  sequence: number;
  version: number;
  status: ProposalStatus;
  rowVersion: number;
  content: ProposalContentByType[AvailableProposalType];
}

export type MutationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: "not_found" | "conflict" | "locked" | "invalid" | "unavailable" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listProposals(): Promise<ProposalSummary[]> {
  return db
    .select({
      id: proposals.id,
      type: proposals.type,
      sequence: proposals.sequence,
      version: proposals.version,
      title: proposals.title,
      clientName: proposals.clientName,
      status: proposals.status,
      issueDate: proposals.issueDate,
      totalPaise: proposals.totalPaise,
    })
    .from(proposals)
    .orderBy(sql`${proposals.issueDate} desc nulls last`, desc(proposals.createdAt));
}

export async function getProposal(id: string): Promise<ProposalDetail | null> {
  if (!UUID.test(id)) return null;
  const [row] = await db.select().from(proposals).where(eq(proposals.id, id));
  if (!row || !isAvailableProposalType(row.type)) return null;
  const content = getProposalTemplate(row.type).contentSchema.parse(row.content);
  return {
    id: row.id,
    type: row.type,
    sequence: row.sequence,
    version: row.version,
    status: row.status,
    rowVersion: row.rowVersion,
    content,
  };
}

export async function createProposal(
  type: AvailableProposalType,
  actorUserId: string,
): Promise<MutationResult<{ id: string }>> {
  const template = getProposalTemplate(type);
  const content = template.createDefaultContent(todayIst(), await getStudioDetails());
  const summary = template.summarize(content);
  const id = crypto.randomUUID();
  const result = await db.execute<{ id: string }>(sql`
    with counter as (
      insert into proposal_counters (type, last_value) values (${type}, 1)
      on conflict (type) do update set last_value = proposal_counters.last_value + 1
      returning last_value
    ),
    created as (
      insert into proposals (id, type, sequence, content, title, client_name, issue_date, total_paise, created_by, updated_by)
      select ${id}, ${type}, counter.last_value, ${JSON.stringify(content)}::jsonb, ${summary.title},
        ${summary.clientName}, ${summary.issueDate}, ${summary.totalPaise}, ${actorUserId}, ${actorUserId}
      from counter
      returning id, sequence
    )
    ${auditInsertFrom(sql`created`, actorUserId, "proposal.created", "proposal", { type })}
    returning entity_id as id
  `);
  return result.rows[0] ? { ok: true, value: { id } } : { ok: false, error: "invalid" };
}

export async function saveProposalContent(input: {
  id: string;
  rowVersion: number;
  content: unknown;
  actorUserId: string;
}): Promise<MutationResult<{ rowVersion: number }>> {
  const current = await db
    .select({
      type: proposals.type,
      status: proposals.status,
      rowVersion: proposals.rowVersion,
      originalProposalId: proposals.originalProposalId,
    })
    .from(proposals)
    .where(eq(proposals.id, input.id));
  const row = current[0];
  if (!row || !isAvailableProposalType(row.type)) return { ok: false, error: "not_found" };
  const template = getProposalTemplate(row.type);
  const parsed = template.contentSchema.safeParse(input.content);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const summary = template.summarize(parsed.data);
  const linkedId = template.linkedProposalId?.(parsed.data) ?? null;
  // A new link must point at an accepted Project Proposal; an existing link stays valid even if
  // that project is revised later.
  if (linkedId && linkedId !== row.originalProposalId && !(await isAcceptedProject(linkedId))) {
    return { ok: false, error: "invalid" };
  }

  const updated = await db
    .update(proposals)
    .set({
      content: parsed.data as Record<string, unknown>,
      title: summary.title,
      clientName: summary.clientName,
      issueDate: summary.issueDate,
      totalPaise: summary.totalPaise,
      originalProposalId: linkedId,
      rowVersion: sql`${proposals.rowVersion} + 1`,
      updatedBy: input.actorUserId,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(proposals.id, input.id),
        eq(proposals.rowVersion, input.rowVersion),
        eq(proposals.status, "draft"),
      ),
    )
    .returning({ rowVersion: proposals.rowVersion });
  if (updated[0]) return { ok: true, value: updated[0] };
  return { ok: false, error: row.status !== "draft" ? "locked" : "conflict" };
}

async function isAcceptedProject(id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(and(eq(proposals.id, id), eq(proposals.type, "project"), eq(proposals.status, "accepted")));
  return Boolean(row);
}

/** Accepted Project Proposals, newest first: what a Change Request can amend. */
export async function listAcceptedProjects(): Promise<AcceptedProject[]> {
  const rows = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.type, "project"), eq(proposals.status, "accepted")))
    .orderBy(sql`${proposals.issueDate} desc nulls last`, desc(proposals.createdAt));
  return rows.flatMap((row) => {
    const parsed = projectContentSchema.safeParse(row.content);
    if (!parsed.success) return [];
    return [
      {
        id: row.id,
        number: formatProposalNumber("project", row.sequence, row.version),
        projectName: parsed.data.projectName,
        issueDate: row.issueDate,
        client: parsed.data.client,
      },
    ];
  });
}

export async function changeProposalStatus(input: {
  id: string;
  to: ProposalStatus;
  actorUserId: string;
}): Promise<MutationResult<{ status: ProposalStatus; rowVersion: number }>> {
  const from = (Object.keys(PROPOSAL_STATUS_TRANSITIONS) as ProposalStatus[]).filter((status) =>
    PROPOSAL_STATUS_TRANSITIONS[status].includes(input.to),
  );
  if (from.length === 0) return { ok: false, error: "invalid" };
  const result = await db.execute<{ row_version: number }>(sql`
    with changed as (
      update proposals
      set status = ${input.to}, row_version = row_version + 1, updated_by = ${input.actorUserId}, updated_at = now()
      where id = ${input.id} and status in (${sql.join(
        from.map((s) => sql`${s}`),
        sql`, `,
      )})
      returning id, row_version
    ),
    audited as (
      ${auditInsertFrom(sql`changed`, input.actorUserId, "proposal.status_changed", "proposal", { to: input.to })}
    )
    select row_version from changed
  `);
  const row = result.rows[0];
  return row
    ? { ok: true, value: { status: input.to, rowVersion: Number(row.row_version) } }
    : { ok: false, error: "conflict" };
}

export async function reviseProposal(
  id: string,
  actorUserId: string,
): Promise<MutationResult<{ id: string }>> {
  const existing = await getProposal(id);
  if (!existing) return { ok: false, error: "not_found" };
  const template = getProposalTemplate(existing.type);
  const content = template.prepareRevision(existing.content, todayIst());
  const summary = template.summarize(content);
  const newId = crypto.randomUUID();
  try {
    // The guard on status and row_version makes a stale or repeated revise insert nothing.
    const result = await db.execute<{ id: string }>(sql`
      with source as (
        select * from proposals
        where id = ${id} and status in ('sent', 'accepted') and row_version = ${existing.rowVersion}
        for update
      ),
      created as (
        insert into proposals (id, type, sequence, version, replaces_id, original_proposal_id, content,
          title, client_name, issue_date, total_paise, created_by, updated_by)
        select ${newId}, type, sequence, version + 1, id, original_proposal_id, ${JSON.stringify(content)}::jsonb,
          ${summary.title}, ${summary.clientName}, ${summary.issueDate}, ${summary.totalPaise},
          ${actorUserId}, ${actorUserId}
        from source
        returning id
      ),
      replaced as (
        update proposals set status = 'replaced', row_version = row_version + 1,
          updated_by = ${actorUserId}, updated_at = now()
        where id = (select id from source) and exists (select 1 from created)
        returning id
      ),
      audited as (
        ${auditInsertFrom(sql`created`, actorUserId, "proposal.revised", "proposal", { replaces: id })}
      )
      select id from created
    `);
    return result.rows[0] ? { ok: true, value: { id: newId } } : { ok: false, error: "conflict" };
  } catch (error) {
    // A concurrent revise of the same offer loses on the (type, sequence, version) unique key.
    if (error instanceof Error && /proposals_number_unique/.test(error.message)) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }
}
