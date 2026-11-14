import { pdf } from "@react-pdf/renderer";
import { registerPdfFonts } from "@/features/documents/pdf/theme";
import { AgreementPdf, type AgreementPdfInput } from "./agreement-pdf";
export async function renderAgreementPdf(input: AgreementPdfInput): Promise<Blob> {
  registerPdfFonts(window.location.origin);
  return pdf(<AgreementPdf {...input} />).toBlob();
}
