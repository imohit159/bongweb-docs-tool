import type { z } from "zod";
import type { StudioDetails } from "@/features/studio/schema";
import type { ProposalType } from "../domain";

export interface EditorSection<S extends string = string> {
  id: S;
  label: string;
}

export interface MissingField<S extends string = string> {
  section: S;
  /** Dotted path into the content, e.g. "client.name" or "items.2.description". */
  path: string;
  label: string;
}

export interface ProposalSummaryColumns {
  title: string;
  clientName: string;
  issueDate: string | null;
  totalPaise: number | null;
}

export interface ProposalTemplate<C = unknown, S extends string = string> {
  type: ProposalType;
  sections: readonly EditorSection<S>[];
  contentSchema: z.ZodType<C>;
  createDefaultContent(today: string, studio: StudioDetails): C;
  findMissingFields(content: C): MissingField<S>[];
  summarize(content: C): ProposalSummaryColumns;
  /** Content for a new revision: usually fresh dates, everything else kept. */
  prepareRevision(content: C, today: string): C;
  /** The accepted Project Proposal a Change Request amends (stored in original_proposal_id). */
  linkedProposalId?(content: C): string | null;
}
