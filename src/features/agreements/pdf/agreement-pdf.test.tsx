import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { registerPdfFonts } from "@/features/documents/pdf/theme";
import { fixture } from "../test-fixtures";
import { AgreementPdf } from "./agreement-pdf";
registerPdfFonts(resolve(__dirname, "../../../../public"));
describe("agreement PDF", () => {
  for (const type of ["project", "retainer"] as const)
    it(`${type}: renders the approved layout in two pages`, async () => {
      const content = fixture(type);
      const pdf = await renderToBuffer(<AgreementPdf number="BW-SA-001" content={content} />);
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)?.length).toBe(2);
      if (process.env.PDF_DIR) writeFileSync(`${process.env.PDF_DIR}/agreement-${type}.pdf`, pdf);
    });
  it("long party names and custom terms remain renderable", async () => {
    const c = fixture("project");
    c.client.business = "International Client ".repeat(8);
    c.provider.address = "A long office address with multiple floors and buildings ".repeat(4);
    c.wording.confidentiality = "Keep client information confidential. ".repeat(30);
    const pdf = await renderToBuffer(<AgreementPdf number="BW-SA-999" content={c} />);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.PDF_DIR) writeFileSync(`${process.env.PDF_DIR}/agreement-long.pdf`, pdf);
  });
});
