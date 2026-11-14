import { PROPOSAL_TEMPLATES } from "@/features/proposals/templates";
import { EMPTY_STUDIO_DETAILS } from "@/features/studio/schema";
import { createAgreementContent } from "./template";

export function fixture(type: "project" | "retainer") {
  const content = PROPOSAL_TEMPLATES[type].createDefaultContent("2026-11-13", EMPTY_STUDIO_DETAILS);
  if ("investment" in content)
    content.investment.pricePaise = { premium: 5000000, standard: 3000000, basic: 1000000 };
  else content.plans.pricePaise = { premium: 3500000, standard: 2500000, basic: 1500000 };
  content.client = {
    name: "Asha Roy",
    business: "Lotus Salon",
    city: "Kolkata",
    phone: "9000000000",
    email: "asha@lotus.in",
  };
  const c = createAgreementContent(
    { id: "12345678-1234-4123-8123-123456789abc", type, sequence: 12, version: 2, content },
    "standard",
    "2026-11-13",
    {
      ...EMPTY_STUDIO_DETAILS,
      address: "Salt Lake, Kolkata, West Bengal",
      email: "hello@bongweb.in",
      signatoryName: "Mohit Kumar",
      signatoryRole: "Founder",
    },
  );
  return {
    ...c,
    title: type === "project" ? "Lotus Salon website" : "Monthly social media management",
    client: { ...c.client, address: "Park Street, Kolkata, West Bengal", role: "Owner" },
    jurisdiction: "Kolkata, West Bengal",
    deliveryDate: "2026-12-15",
    startDate: "2026-12-01",
  };
}
