import { formatProposalNumber } from "@/features/proposals/domain";
import { PLAN_TIER_LABELS, type PlanTier } from "@/features/proposals/schema";
import type { ProjectContent } from "@/features/proposals/templates/project";
import type { RetainerContent } from "@/features/proposals/templates/retainer";
import type { StudioDetails } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import type { AgreementType } from "./domain";
import type { AgreementContent, ClauseId } from "./schema";

export const AGREEMENT_SECTIONS = [
  { id: "details", label: "Details and parties" },
  { id: "work", label: "Work and responsibilities" },
  { id: "payment", label: "Fees and payment" },
  { id: "ownership", label: "Ownership and privacy" },
  { id: "ending", label: "Ending the engagement" },
  { id: "acceptance", label: "Acceptance and signatures" },
] as const;
export type AgreementSection = (typeof AGREEMENT_SECTIONS)[number]["id"];
export interface AgreementClause {
  id: ClauseId;
  label: string;
  text: string;
}
export interface AgreementClauseGroup {
  id: AgreementSection;
  title: string;
  clauses: AgreementClause[];
}
const day = (v: string, label: string) => (v ? formatDocDate(v) : `[${label}]`);

export function agreementClauseGroups(c: AgreementContent): AgreementClauseGroup[] {
  const project = c.type === "project";
  const clause = (id: ClauseId, label: string, fallback: string): AgreementClause => ({
    id,
    label,
    text: c.wording[id]?.trim() || fallback,
  });
  return [
    {
      id: "work",
      title: "2 Work and responsibilities",
      clauses: [
        clause(
          "start",
          project ? "Start and delivery" : "Monthly services",
          project
            ? `Work starts after the advance is received. Estimated delivery: ${day(c.deliveryDate, "Estimated delivery")}, following the proposal milestones. Client delays extend delivery by at least the same time.`
            : `Services start on ${day(c.startDate, "Start date")}. Deliverables, platforms, revisions and reporting follow the accepted plan. Unused monthly deliverables do not carry over and are not refunded.`,
        ),
        clause(
          "approvals",
          "Client inputs and approvals",
          project
            ? "The Client supplies content and access on time and responds within 5 working days. No comments within 10 working days means approval. After 30 days without a response, work may pause; restart depends on availability."
            : "The Client supplies assets and access on time. Bongweb shares the monthly plan by the 25th of the previous month. Feedback is due within 2 working days; unanswered items are treated as approved.",
        ),
        clause(
          "extra",
          project ? "Revisions and extra work" : "Extra work",
          project
            ? "One revision round is one consolidated list. Extra revisions or scope changes need a written Change Request with an agreed fee and timeline, paid in full before work starts."
            : "Additional deliverables and revision rounds are quoted separately. Both parties approve the fee and schedule in writing before that work starts.",
        ),
        clause(
          "support",
          project ? "Support" : "Account access",
          project
            ? "Defects in delivered work are fixed for 30 days after launch. New features, content edits, third-party updates and changes by others are excluded. Maintenance is separate."
            : "Accounts stay in the Client’s name. Bongweb receives only the access needed for the services. The Client keeps accounts and subscriptions active and paid.",
        ),
      ],
    },
    {
      id: "payment",
      title: "3 Fees and payment",
      clauses: [
        clause(
          "payment",
          project ? "Due dates" : "Payment and pauses",
          project
            ? "Invoices are due within 7 days. The next phase starts after payment. The advance is non-refundable once planning or first-phase work begins."
            : "Monthly work starts after payment. If payment is over 10 days late, services may pause; paused days are not added back. After the minimum term, fee changes require 30 days’ written notice, allowing cancellation under section 5.",
        ),
        clause(
          "tax",
          "Costs and tax",
          "Fees are in INR. Bongweb is not GST registered and does not charge GST. Third-party costs are excluded and paid directly by the Client. Payment details are on the invoice.",
        ),
      ],
    },
    {
      id: "ownership",
      title: "4 Ownership and confidentiality",
      clauses: [
        clause(
          "ownership",
          "Ownership and handover",
          project
            ? "After full payment, the Client owns the final work created for this project. Final files, agreed source files, admin logins and go-live are released after final payment."
            : "The Client owns work created for it after that month’s fee is paid. Paid content files are handed over and Bongweb’s access removed within 7 days of final payment when the engagement ends.",
        ),
        clause(
          "licences",
          "Tools and licences",
          "Bongweb retains its tools, templates and libraries; the Client receives a permanent, non-exclusive licence to use them in the delivered work. Third-party licences still apply. The Client must have permission to use materials it supplies.",
        ),
        clause(
          "confidentiality",
          "Confidential information",
          "Both parties protect private information, data and credentials and use them only for this engagement. Public, independently known or legally required disclosures are excluded. This duty continues for 2 years after termination. Change shared passwords after handover.",
        ),
        clause(
          "portfolio",
          "Portfolio",
          "Bongweb may show completed work and the Client’s name and logo unless the Client requests privacy in writing. Confidential information is never shown.",
        ),
      ],
    },
    {
      id: "ending",
      title: "5 Ending the engagement",
      clauses: [
        clause(
          "termination",
          project ? "Notice and settlement" : "Term and cancellation",
          project
            ? "Either party may end with 15 days’ written notice. The Client pays for work done, at least the milestone in progress. Completed, paid work is handed over. Bongweb may pause or end after written notice if payment is over 15 days late."
            : `Minimum term: ${c.minimumTermMonths} months, then monthly renewal. Either party may stop with 30 days’ written notice, effective after the minimum term. If the Client cancels earlier, remaining minimum-term fees are payable.`,
        ),
        ...(!project
          ? [
              clause(
                "breach",
                "Breach and settlement",
                "Either party may end for a serious breach not fixed within 7 days of written notice. All fees due through the end date remain payable.",
              ),
            ]
          : []),
        clause(
          "responsibility",
          "Service responsibility",
          "Bongweb uses professional skill and care; rankings, leads and sales are not guaranteed. Third-party outages and changes are outside its responsibility. Neither party is responsible for delays beyond its reasonable control.",
        ),
        clause(
          "liability",
          "Liability",
          "Bongweb’s total liability is limited to fees paid under this agreement in the 3 months before the claim. Neither party is liable for indirect losses such as lost profit, revenue or data.",
        ),
        clause(
          "disputes",
          "Disputes",
          `Indian law applies. First discuss disputes for 30 days; then courts at ${c.jurisdiction.trim() || "[City, State]"} have exclusive jurisdiction. Payment, ownership, confidentiality and liability terms continue as applicable after termination.`,
        ),
      ],
    },
    {
      id: "acceptance",
      title: "6 Acceptance and signatures",
      clauses: [
        clause(
          "notices",
          "Notices and changes",
          "Bongweb acts as an independent service provider. Formal notices go to the emails in section 1; WhatsApp may be used for routine approvals. Changes need both parties’ written approval, including by email.",
        ),
        clause(
          "acceptance",
          "Acceptance",
          "By signing, both parties accept this agreement and the referenced proposal. Signatures may be exchanged electronically.",
        ),
      ],
    },
  ];
}

export interface AgreementSource {
  id: string;
  type: AgreementType;
  sequence: number;
  version: number;
  content: ProjectContent | RetainerContent;
}
export function createAgreementContent(
  source: AgreementSource,
  tier: PlanTier,
  today: string,
  studio: StudioDetails,
): AgreementContent {
  const project = source.type === "project";
  const plans = "investment" in source.content ? source.content.investment : source.content.plans;
  const retainer = !project ? (source.content as RetainerContent) : null;
  return {
    type: source.type,
    issueDate: today,
    title: "projectName" in source.content ? source.content.projectName : "Monthly services",
    proposal: {
      id: source.id,
      number: formatProposalNumber(source.type, source.sequence, source.version),
      date: source.content.issueDate,
      option: plans.mode === "single" ? "Single price" : PLAN_TIER_LABELS[tier],
    },
    feePaise: plans.pricePaise[tier],
    client: { ...source.content.client, address: "", role: "" },
    provider: {
      legalName: studio.signatoryName,
      address: studio.address,
      email: studio.email,
      role: studio.signatoryRole,
    },
    startDate: retainer?.startDate ?? "",
    deliveryDate: "",
    minimumTermMonths: retainer?.minimumTermMonths ?? 3,
    feeDueDay: retainer?.feeDueDay ?? 5,
    jurisdiction: "",
    clientSignDate: "",
    providerSignDate: "",
    wording: {},
  };
}
export interface MissingAgreementField {
  section: AgreementSection;
  label: string;
}

export function findMissingAgreementFieldDetails(c: AgreementContent): MissingAgreementField[] {
  const fields: { section: AgreementSection; label: string; value: string }[] = [
    { section: "details", label: "Agreement date", value: c.issueDate },
    { section: "details", label: "Project or plan name", value: c.title },
    { section: "details", label: "Provider legal name", value: c.provider.legalName },
    { section: "details", label: "Provider address", value: c.provider.address },
    { section: "details", label: "Provider email", value: c.provider.email },
    { section: "details", label: "Client signatory name", value: c.client.name },
    { section: "details", label: "Client address", value: c.client.address },
    { section: "details", label: "Client email", value: c.client.email },
    { section: "ending", label: "Jurisdiction", value: c.jurisdiction },
    {
      section: "work",
      label: c.type === "project" ? "Estimated delivery" : "Start date",
      value: c.type === "project" ? c.deliveryDate : c.startDate,
    },
  ];
  const missing = fields
    .filter(({ value }) => !value.trim())
    .map(({ section, label }) => ({ section, label }));
  if (!c.feePaise) missing.push({ section: "payment", label: "Agreed fee" });
  return missing;
}

export function findMissingAgreementFields(c: AgreementContent): string[] {
  return findMissingAgreementFieldDetails(c).map(({ label }) => label);
}
