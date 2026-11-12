import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import { quotationTemplate } from "../templates/quotation";
import { QuotationPdf } from "./quotation-pdf";
import { registerPdfFonts } from "./theme";

registerPdfFonts(resolve(__dirname, "../../../../public"));

describe("QuotationPdf", () => {
  it("renders a blank draft with gaps", async () => {
    const content = quotationTemplate.createDefaultContent("2026-11-12", EMPTY_STUDIO_DETAILS);
    const buffer = await renderToBuffer(
      <QuotationPdf number="BW-Q-001" content={content} studio={EMPTY_STUDIO_DETAILS} />,
    );
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT.replace(".pdf", "-blank.pdf"), buffer);
  });

  it("renders a filled quotation", async () => {
    const content = {
      ...quotationTemplate.createDefaultContent("2026-11-12", EMPTY_STUDIO_DETAILS),
      client: {
        name: "Asha Roy",
        business: "Lotus Salon",
        city: "Kolkata",
        phone: "+91 98300 00000",
        email: "asha@lotus.in",
      },
      work: {
        description:
          "Design and build a one-page website for your salon with a booking button linked to WhatsApp.",
        included: "one-page website, WhatsApp booking button, 2 revision rounds",
        notIncluded: "domain and hosting fees, content writing",
      },
      items: [
        { id: "a", description: "One-page website", qty: 1, ratePaise: 15_000_00 },
        { id: "b", description: "WhatsApp booking button setup", qty: 1, ratePaise: 3_000_00 },
      ],
      timeline: { start: "2026-11-20", delivery: "2026-12-04", weNeed: "logo, photos, text, by 18 Nov 2026" },
    };
    const studio = {
      ...EMPTY_STUDIO_DETAILS,
      address: "Salt Lake, Kolkata, West Bengal",
      phone: "+91 90000 00000",
      email: "hello@bongweb.in",
      website: "bongweb.in",
      upiId: "bongweb@okaxis",
      accountName: "Bongweb Studio",
      accountNumber: "000000000000",
      ifsc: "UTIB0000000",
      bankName: "Axis Bank",
      signatoryName: "Mohit Kumar",
    };
    const buffer = await renderToBuffer(<QuotationPdf number="BW-Q-001" content={content} studio={studio} />);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT, buffer);
  });
});
