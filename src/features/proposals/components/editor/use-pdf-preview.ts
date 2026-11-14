"use client";

import { useMemo } from "react";
import { useDocumentPdfPreview } from "@/features/documents/hooks/use-pdf-preview";
import type { PdfInput } from "../../pdf/render";
import { useEditor } from "./editor-store";

async function render(input: PdfInput) {
  const { renderProposalPdf } = await import("../../pdf/render");
  return renderProposalPdf(input);
}

export function usePdfPreview() {
  const proposal = useEditor((s) => s.proposal);
  const content = useEditor((s) => s.content);
  const studio = useEditor((s) => s.studio);
  const input = useMemo(
    () => ({ type: proposal.type, number: proposal.number, content, studio }),
    [proposal.type, proposal.number, content, studio],
  );
  return useDocumentPdfPreview(input, render);
}
