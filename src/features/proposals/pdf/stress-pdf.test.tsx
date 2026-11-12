import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { EMPTY_STUDIO_DETAILS, type StudioDetails } from "@/features/studio/schema";
import { isIsoDay } from "@/lib/dates";
import { PROPOSAL_TEMPLATES, getProposalTemplate, type AvailableProposalType } from "../templates";
import { documentFor } from "./render";
import { registerPdfFonts } from "./theme";

// Regression guard for overflow: every text field filled with worst-case input.
// The test proves rendering survives; the PDFs (PDF_DIR) are for visual review.

registerPdfFonts(resolve(__dirname, "../../../../public"));

const KEEP_KEYS = new Set(["id", "mode", "recommended", "proposalId", "frequency"]);

function fill(value: unknown, text: (key: string) => string, key = ""): unknown {
  if (typeof value === "string") {
    if (KEEP_KEYS.has(key) || isIsoDay(value)) return value;
    if (/date|until|delivery|^start$/i.test(key)) return "2026-12-31";
    return text(key);
  }
  if (typeof value === "number") return key.toLowerCase().includes("paise") ? 99_99_99_999_00 : value;
  if (Array.isArray(value)) return value.map((item) => fill(item, text, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, text, k)]));
  }
  return value;
}

const CASES = {
  unspaced: () => "W".repeat(60),
  sentences: () =>
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua https://example.com/a-very-long-link-to-some-portfolio-page",
};

describe("PDF stress", () => {
  for (const type of Object.keys(PROPOSAL_TEMPLATES) as AvailableProposalType[]) {
    for (const [name, text] of Object.entries(CASES)) {
      it(`${type}: ${name}`, async () => {
        const base = getProposalTemplate(type).createDefaultContent("2026-11-13", EMPTY_STUDIO_DETAILS);
        const content = fill(base, text) as typeof base;
        const studio = fill(EMPTY_STUDIO_DETAILS, text) as StudioDetails;
        const pdf = await renderToBuffer(documentFor({ type, number: "BW-CR-999 v12", content, studio }));
        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
        if (process.env.PDF_DIR) writeFileSync(`${process.env.PDF_DIR}/stress-${type}-${name}.pdf`, pdf);
      }, 30_000);
    }
  }
});
