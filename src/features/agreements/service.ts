import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { auditInsertFrom } from "@/features/audit/service";
import { formatProposalNumber } from "@/features/proposals/domain";
import { visibleTiers, PLAN_TIER_LABELS, type PlanTier } from "@/features/proposals/schema";
import { projectContentSchema } from "@/features/proposals/templates/project";
import { retainerContentSchema } from "@/features/proposals/templates/retainer";
import { getStudioDetails } from "@/features/studio/service";
import { todayIst } from "@/lib/dates";
import { db } from "@/server/db/client";
import { agreements, proposals } from "@/server/db/schema";
import { AGREEMENT_TRANSITIONS, type AgreementStatus, type AgreementSummary } from "./domain";
import { agreementContentSchema, type AgreementContent } from "./schema";
import { createAgreementContent, findMissingAgreementFields, type AgreementSource } from "./template";

export type AgreementResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: "invalid" | "not_found" | "locked" | "conflict" | "incomplete" };
export interface AgreementDetail {
  id: string;
  sequence: number;
  status: AgreementStatus;
  rowVersion: number;
  content: AgreementContent;
}
export interface AcceptedAgreementProposal {
  id: string;
  number: string;
  title: string;
  clientName: string;
  options: { tier: PlanTier; label: string; feePaise: number }[];
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function sourceFrom(row: typeof proposals.$inferSelect): AgreementSource | null {
  if (row.type !== "project" && row.type !== "retainer") return null;
  const parsed =
    row.type === "project"
      ? projectContentSchema.safeParse(row.content)
      : retainerContentSchema.safeParse(row.content);
  return parsed.success
    ? { id: row.id, type: row.type, sequence: row.sequence, version: row.version, content: parsed.data }
    : null;
}
export async function listAgreementSources(): Promise<AcceptedAgreementProposal[]> {
  const rows = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.status, "accepted"), inArray(proposals.type, ["project", "retainer"])))
    .orderBy(desc(proposals.createdAt));
  return rows.flatMap((row) => {
    const source = sourceFrom(row);
    if (!source) return [];
    const c = source.content;
    const plans = "investment" in c ? c.investment : c.plans;
    return [
      {
        id: source.id,
        number: formatProposalNumber(source.type, source.sequence, source.version),
        title: "projectName" in c ? c.projectName : "Monthly services",
        clientName: [c.client.name, c.client.business].filter(Boolean).join(", "),
        options: visibleTiers(plans).map((tier) => ({
          tier,
          label: plans.mode === "single" ? "Single price" : PLAN_TIER_LABELS[tier],
          feePaise: plans.pricePaise[tier],
        })),
      },
    ];
  });
}
export async function listAgreements(): Promise<AgreementSummary[]> {
  return db
    .select({
      id: agreements.id,
      type: agreements.type,
      sequence: agreements.sequence,
      status: agreements.status,
      title: agreements.title,
      clientName: agreements.clientName,
      issueDate: agreements.issueDate,
      totalPaise: agreements.totalPaise,
    })
    .from(agreements)
    .orderBy(desc(agreements.createdAt));
}
export async function getAgreement(id: string): Promise<AgreementDetail | null> {
  if (!UUID.test(id)) return null;
  const [row] = await db.select().from(agreements).where(eq(agreements.id, id));
  if (!row) return null;
  return {
    id: row.id,
    sequence: row.sequence,
    status: row.status,
    rowVersion: row.rowVersion,
    content: agreementContentSchema.parse(row.content),
  };
}
export async function createAgreement(
  proposalId: string,
  tier: PlanTier,
  actor: string,
): Promise<AgreementResult<{ id: string }>> {
  const [row] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.status, "accepted")));
  const source = row && sourceFrom(row);
  if (!source) return { ok: false, error: "invalid" };
  const plans = "investment" in source.content ? source.content.investment : source.content.plans;
  if (!visibleTiers(plans).includes(tier)) return { ok: false, error: "invalid" };
  const content = agreementContentSchema.parse(
    createAgreementContent(source, tier, todayIst(), await getStudioDetails()),
  );
  const id = crypto.randomUUID();
  const result = await db.execute(sql`
    with source as (select id from proposals where id=${proposalId} and status='accepted' and row_version=${row.rowVersion} for share),
    counter as (
      insert into agreement_counter (id,last_value) select 1,1 from source
      on conflict (id) do update set last_value=agreement_counter.last_value+1 returning last_value
    ), created as (
      insert into agreements (id,type,sequence,proposal_id,title,client_name,issue_date,total_paise,content,created_by,updated_by)
      select ${id},${content.type},counter.last_value,${proposalId},${content.title},${content.client.business || content.client.name},${content.issueDate || null},${content.feePaise},${JSON.stringify(content)}::jsonb,${actor},${actor} from counter
      returning id
    ) ${auditInsertFrom(sql`created`, actor, "agreement.created", "agreement", { proposalId })} returning entity_id
  `);
  return result.rows[0] ? { ok: true, value: { id } } : { ok: false, error: "conflict" };
}
export async function saveAgreement(
  input: { id: string; rowVersion: number; content: unknown },
  actor: string,
): Promise<AgreementResult<{ rowVersion: number }>> {
  const parsed = agreementContentSchema.safeParse(input.content);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const current = await getAgreement(input.id);
  if (!current) return { ok: false, error: "not_found" };
  if (current.status !== "draft") return { ok: false, error: "locked" };
  const content = parsed.data;
  // The accepted proposal and chosen price are a snapshot, never a free-form link.
  if (
    content.type !== current.content.type ||
    content.feePaise !== current.content.feePaise ||
    JSON.stringify(content.proposal) !== JSON.stringify(current.content.proposal)
  )
    return { ok: false, error: "invalid" };
  const [updated] = await db
    .update(agreements)
    .set({
      content,
      title: content.title,
      clientName: content.client.business || content.client.name,
      issueDate: content.issueDate || null,
      rowVersion: sql`${agreements.rowVersion}+1`,
      updatedAt: sql`now()`,
      updatedBy: actor,
    })
    .where(
      and(
        eq(agreements.id, input.id),
        eq(agreements.rowVersion, input.rowVersion),
        eq(agreements.status, "draft"),
      ),
    )
    .returning({ rowVersion: agreements.rowVersion });
  return updated ? { ok: true, value: updated } : { ok: false, error: "conflict" };
}
export async function changeAgreementStatus(
  input: { id: string; rowVersion: number; to: AgreementStatus },
  actor: string,
): Promise<AgreementResult<{ status: AgreementStatus; rowVersion: number }>> {
  const current = await getAgreement(input.id);
  if (!current) return { ok: false, error: "not_found" };
  if (!AGREEMENT_TRANSITIONS[current.status].includes(input.to)) return { ok: false, error: "invalid" };
  if (input.to !== "draft" && findMissingAgreementFields(current.content).length)
    return { ok: false, error: "incomplete" };
  const result = await db.execute<{ row_version: number }>(sql`
    with changed as (
      update agreements set status=${input.to},row_version=row_version+1,updated_at=now(),updated_by=${actor}
      where id=${input.id} and row_version=${input.rowVersion} and status=${current.status} returning id,row_version
    ), audited as (${auditInsertFrom(sql`changed`, actor, "agreement.status_changed", "agreement", { to: input.to })})
    select row_version from changed
  `);
  return result.rows[0]
    ? { ok: true, value: { status: input.to, rowVersion: Number(result.rows[0].row_version) } }
    : { ok: false, error: "conflict" };
}
