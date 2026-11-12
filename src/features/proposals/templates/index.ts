import type { ProposalType } from "../domain";
import { changeTemplate, type ChangeContent } from "./change";
import { projectTemplate, type ProjectContent } from "./project";
import { quotationTemplate, type QuotationContent } from "./quotation";
import { retainerTemplate, type RetainerContent } from "./retainer";
import type { ProposalTemplate } from "./types";

export interface ProposalContentByType {
  quotation: QuotationContent;
  project: ProjectContent;
  retainer: RetainerContent;
  change: ChangeContent;
}
export type AvailableProposalType = keyof ProposalContentByType;

export const PROPOSAL_TEMPLATES: {
  [T in AvailableProposalType]: ProposalTemplate<ProposalContentByType[T]>;
} = {
  quotation: quotationTemplate,
  project: projectTemplate,
  retainer: retainerTemplate,
  change: changeTemplate,
};

export function isAvailableProposalType(type: ProposalType): type is AvailableProposalType {
  return type in PROPOSAL_TEMPLATES;
}

export function getProposalTemplate(type: AvailableProposalType) {
  return PROPOSAL_TEMPLATES[type] as ProposalTemplate<ProposalContentByType[AvailableProposalType]>;
}

export type { EditorSection, MissingField, ProposalSummaryColumns, ProposalTemplate } from "./types";
