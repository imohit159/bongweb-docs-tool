"use client";

import { useMemo } from "react";
import { findMissingStudioFields } from "@/features/studio/schema";
import { getProposalTemplate } from "../../templates";
import { useEditor, useEditorStoreApi } from "./editor-store";

export function useMissingFields() {
  const type = useEditor((s) => s.proposal.type);
  const content = useEditor((s) => s.content);
  const studio = useEditor((s) => s.studio);
  return useMemo(() => {
    const template = getProposalTemplate(type);
    const fields = template.findMissingFields(content);
    const studioFields = findMissingStudioFields(studio);
    const bySection = new Map<string, number>();
    for (const field of fields) bySection.set(field.section, (bySection.get(field.section) ?? 0) + 1);
    return { fields, studioFields, bySection, total: fields.length + studioFields.length };
  }, [type, content, studio]);
}

function fileName(number: string, client: string) {
  const safe = `${number} ${client}`
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${safe || number}.pdf`;
}

/** Renders the latest content (never a stale preview) and saves it as a file. */
export function useDownloadPdf() {
  const store = useEditorStoreApi();
  return async () => {
    const { proposal, content, studio } = store.getState();
    const { renderProposalPdf } = await import("../../pdf/render");
    const blob = await renderProposalPdf({ type: proposal.type, number: proposal.number, content, studio });
    const summary = getProposalTemplate(proposal.type).summarize(content);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(proposal.number, summary.clientName);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };
}
