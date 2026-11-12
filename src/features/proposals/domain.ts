// Single source of truth for the Proposals family (docs/proposal-templates-v3/FLOW.md).

export const PROPOSAL_TYPES = ["quotation", "project", "retainer", "change"] as const;
export type ProposalType = (typeof PROPOSAL_TYPES)[number];

interface ProposalTypeDetails {
  label: string;
  pluralLabel: string;
  numberPrefix: string;
  useWhen: string;
  paymentTerms: string;
}

export const PROPOSAL_TYPE_DETAILS: Record<ProposalType, ProposalTypeDetails> = {
  quotation: {
    label: "Quotation",
    pluralLabel: "Quotations",
    numberPrefix: "BW-Q",
    useWhen: "The client knows exactly what they want, and the job is small.",
    paymentTerms: "50% advance, 50% on delivery",
  },
  project: {
    label: "Project Proposal",
    pluralLabel: "Projects",
    numberPrefix: "BW-P",
    useWhen: "The client has a problem to solve with a one-time project.",
    paymentTerms: "50% advance, 40% on design/beta approval, 10% before go-live",
  },
  retainer: {
    label: "Retainer Proposal",
    pluralLabel: "Retainers",
    numberPrefix: "BW-R",
    useWhen: "Ongoing monthly work, such as maintenance or social media.",
    paymentTerms: "Monthly in advance; minimum term; 30 days' notice to stop",
  },
  change: {
    label: "Change Request",
    pluralLabel: "Changes",
    numberPrefix: "BW-CR",
    useWhen: "Extra work on a project that is already accepted.",
    paymentTerms: "100% before the change work starts",
  },
};

export const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "replaced"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  replaced: "Replaced",
};

export interface ProposalSummary {
  id: string;
  type: ProposalType;
  sequence: number;
  version: number;
  title: string;
  clientName: string;
  status: ProposalStatus;
  /** ISO calendar day (YYYY-MM-DD), interpreted in IST; null until set. */
  issueDate: string | null;
  /** Whole paise; null while pricing is not filled in. */
  totalPaise: number | null;
}

export function isProposalType(value: string): value is ProposalType {
  return (PROPOSAL_TYPES as readonly string[]).includes(value);
}

/** BW-P-001, and BW-P-001 v2 for revisions. */
export function formatProposalNumber(type: ProposalType, sequence: number, version = 1): string {
  if (!Number.isInteger(sequence) || sequence < 1)
    throw new RangeError("sequence must be a positive integer");
  if (!Number.isInteger(version) || version < 1) throw new RangeError("version must be a positive integer");
  const base = `${PROPOSAL_TYPE_DETAILS[type].numberPrefix}-${String(sequence).padStart(3, "0")}`;
  return version > 1 ? `${base} v${version}` : base;
}

/** Allowed manual status changes. "replaced" is set only by revising. */
export const PROPOSAL_STATUS_TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "draft"],
  accepted: [],
  replaced: [],
};

export function canChangeStatus(from: ProposalStatus, to: ProposalStatus): boolean {
  return PROPOSAL_STATUS_TRANSITIONS[from].includes(to);
}

/** Only drafts are edited in place; a sent or accepted offer changes through a revision. */
export function isEditableStatus(status: ProposalStatus): boolean {
  return status === "draft";
}

export function canRevise(status: ProposalStatus): boolean {
  return status === "sent" || status === "accepted";
}
