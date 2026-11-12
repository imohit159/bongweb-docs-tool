import { pdf } from "@react-pdf/renderer";
import type { StudioDetails } from "@/features/studio/schema";
import type { AvailableProposalType, ProposalContentByType } from "../templates";
import type { ChangeContent } from "../templates/change";
import type { ProjectContent } from "../templates/project";
import type { QuotationContent } from "../templates/quotation";
import type { RetainerContent } from "../templates/retainer";
import { ChangePdf } from "./change-pdf";
import { ProjectPdf } from "./project-pdf";
import { QuotationPdf } from "./quotation-pdf";
import { RetainerPdf } from "./retainer-pdf";
import { registerPdfFonts } from "./theme";

// Browser-only: imported dynamically by the editor so react-pdf never loads on the server.

export interface PdfInput {
  type: AvailableProposalType;
  number: string;
  content: ProposalContentByType[AvailableProposalType];
  studio: StudioDetails;
}

export function documentFor(input: PdfInput) {
  const { number, studio } = input;
  switch (input.type) {
    case "quotation":
      return <QuotationPdf number={number} content={input.content as QuotationContent} studio={studio} />;
    case "project":
      return <ProjectPdf number={number} content={input.content as ProjectContent} studio={studio} />;
    case "retainer":
      return <RetainerPdf number={number} content={input.content as RetainerContent} studio={studio} />;
    case "change":
      return <ChangePdf number={number} content={input.content as ChangeContent} studio={studio} />;
  }
}

export async function renderProposalPdf(input: PdfInput): Promise<Blob> {
  registerPdfFonts(window.location.origin);
  return pdf(documentFor(input)).toBlob();
}
