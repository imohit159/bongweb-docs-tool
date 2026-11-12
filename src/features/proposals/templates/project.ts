import { z } from "zod";
import type { StudioDetails } from "@/features/studio/schema";
import { addDays } from "@/lib/dates";
import { splitByPercent } from "@/lib/money";
import {
  EMPTY_CLIENT,
  PLAN_TIER_LABELS,
  clientSchema,
  filledItems,
  headlinePrice,
  isoDayOrBlank,
  listOf,
  listSchema,
  newRowId,
  planComparisonSchema,
  planRows,
  rowId,
  text,
  visibleTiers,
  wordingOverridesSchema,
  type WordingDefinition,
} from "../schema";
import type { MissingField, ProposalTemplate } from "./types";

// Mirrors docs/proposal-templates-v3/pdf/02-project-proposal.pdf.

export const PROJECT_VALIDITY_DAYS = 15;

/** Payment schedule from FLOW.md: 50% advance, 40% on design/beta approval, 10% before go-live. */
export const PROJECT_MILESTONES = [
  { key: "advance", label: "Advance", when: "On acceptance, before work starts", percent: 50 },
  { key: "milestone", label: "Milestone", when: "On approval of design / beta", percent: 40 },
  { key: "final", label: "Final", when: "Before go-live and handover", percent: 10 },
] as const;

export const PROJECT_SECTIONS = [
  { id: "details", label: "Details" },
  { id: "client", label: "Client" },
  { id: "summary", label: "Summary" },
  { id: "problems", label: "Problems" },
  { id: "solution", label: "Our solution" },
  { id: "timeline", label: "Timeline" },
  { id: "investment", label: "Investment" },
  { id: "thirdParty", label: "Third-party costs" },
  { id: "whyUs", label: "Why Bongweb" },
  { id: "nextSteps", label: "Next steps" },
  { id: "terms", label: "Terms" },
  { id: "contact", label: "Contact" },
] as const;
export type ProjectSection = (typeof PROJECT_SECTIONS)[number]["id"];

export const PROJECT_WORDING = {
  investmentIntro: {
    label: "Investment intro",
    text: "Choose the option that fits you best. Standard is our recommendation for most businesses.",
  },
  finalFilesNote: {
    label: "After payment breakdown",
    text: "Final files, logins and go-live are handed over after the final payment.",
  },
  thirdPartyIntro: {
    label: "Third-party costs intro",
    text: "These are paid by you directly to the provider, in your own name. They are not part of our fee.",
  },
  nextStep1: { label: "Next step 1", text: "Review this proposal and choose an option." },
  nextStep2: { label: "Next step 2", text: "Sign below or reply “Approved” on WhatsApp or email." },
  nextStep3: { label: "Next step 3", text: "Pay the 50% advance." },
} as const satisfies Record<string, WordingDefinition>;
export type ProjectWordingKey = keyof typeof PROJECT_WORDING;
const WORDING_KEYS = Object.keys(PROJECT_WORDING) as [ProjectWordingKey, ...ProjectWordingKey[]];

export const DEFAULT_PROJECT_TERMS = [
  "Prices are in Indian Rupees. GST is not applicable: Bongweb Studio is not registered under GST.",
  "Work starts once the advance payment is received.",
  "Revision rounds are as listed; extra rounds are charged separately.",
  "Work outside this proposal is quoted separately through a change request.",
  "Timelines depend on receiving your content, feedback and access on time.",
  "A service agreement with full terms is signed before work starts.",
];

const serviceSchema = z
  .object({
    id: rowId,
    name: text(120),
    whatYouGet: text(600),
    revisions: text(80),
    weNeed: text(400),
    notIncluded: text(400),
  })
  .strict();
export type ServiceBlock = z.infer<typeof serviceSchema>;

export const newService = (): ServiceBlock => ({
  id: newRowId(),
  name: "",
  whatYouGet: "",
  revisions: "",
  weNeed: "",
  notIncluded: "",
});

export const projectContentSchema = z
  .object({
    projectName: text(160),
    outcome: text(200),
    issueDate: isoDayOrBlank,
    validUntil: isoDayOrBlank,
    /** No longer printed (the logo identifies the studio); kept so saved offers stay valid. */
    preparedBy: text(120),
    client: clientSchema,
    summary: text(2400),
    highlights: listSchema(6, 200),
    problems: listSchema(8),
    goals: listSchema(8),
    requirements: listSchema(8),
    solution: z
      .object({
        approach: text(800),
        services: z.array(serviceSchema).max(8),
        whyApproach: text(1200),
      })
      .strict(),
    phases: z
      .array(z.object({ id: rowId, name: text(60), what: text(300), duration: text(40) }).strict())
      .max(10),
    investment: planComparisonSchema,
    thirdParty: z
      .array(
        z
          .object({
            id: rowId,
            item: text(120),
            costPaise: z.number().int().min(0).max(1_000_000_000_00),
            period: text(20),
            paidTo: text(120),
          })
          .strict(),
      )
      .max(10),
    whyBongweb: listSchema(6),
    relevantWork: text(800),
    kickoffDate: isoDayOrBlank,
    terms: listSchema(12, 400),
    contact: z.object({ name: text(120), role: text(80), phone: text(40), email: text(160) }).strict(),
    wording: wordingOverridesSchema(WORDING_KEYS),
  })
  .strict();
export type ProjectContent = z.infer<typeof projectContentSchema>;

export function projectPayment(content: ProjectContent) {
  const total = headlinePrice(content.investment);
  const amounts = splitByPercent(
    total,
    PROJECT_MILESTONES.map((m) => m.percent),
  );
  return { total, milestones: PROJECT_MILESTONES.map((m, i) => ({ ...m, amount: amounts[i] })) };
}

function findMissingFields(content: ProjectContent): MissingField<ProjectSection>[] {
  const missing: MissingField<ProjectSection>[] = [];
  const need = (section: ProjectSection, path: string, label: string, value: string) => {
    if (!value.trim()) missing.push({ section, path, label });
  };
  const needList = (section: ProjectSection, path: string, label: string, items: { text: string }[]) => {
    if (filledItems(items).length === 0) missing.push({ section, path, label });
  };
  need("details", "projectName", "Project name", content.projectName);
  need("details", "outcome", "One-line outcome", content.outcome);
  need("details", "issueDate", "Date", content.issueDate);
  need("details", "validUntil", "Valid until", content.validUntil);
  need("client", "client.name", "Client name", content.client.name);
  need("client", "client.business", "Business name", content.client.business);
  need("summary", "summary", "Summary", content.summary);
  needList("summary", "highlights", "Key highlights", content.highlights);
  needList("problems", "problems", "Problems we noticed", content.problems);
  needList("problems", "goals", "What you want to achieve", content.goals);
  needList("problems", "requirements", "Key requirements", content.requirements);
  need("solution", "solution.approach", "Approach", content.solution.approach);
  if (content.solution.services.length === 0)
    missing.push({ section: "solution", path: "solution.services", label: "At least one service" });
  content.solution.services.forEach((service, i) => {
    need("solution", `solution.services.${i}.name`, `Service ${i + 1} name`, service.name);
    need(
      "solution",
      `solution.services.${i}.whatYouGet`,
      `Service ${i + 1}: what you get`,
      service.whatYouGet,
    );
  });
  need("solution", "solution.whyApproach", "Why this approach", content.solution.whyApproach);
  content.phases.forEach((phase, i) => {
    need("timeline", `phases.${i}.what`, `Phase ${i + 1}: what happens`, phase.what);
    need("timeline", `phases.${i}.duration`, `Phase ${i + 1}: duration`, phase.duration);
  });
  for (const tier of visibleTiers(content.investment)) {
    if (content.investment.pricePaise[tier] <= 0)
      missing.push({
        section: "investment",
        path: `investment.pricePaise.${tier}`,
        label: `${PLAN_TIER_LABELS[tier]} price`,
      });
  }
  needList("whyUs", "whyBongweb", "Reasons to choose Bongweb", content.whyBongweb);
  need("nextSteps", "kickoffDate", "Kick-off date", content.kickoffDate);
  need("contact", "contact.name", "Contact name", content.contact.name);
  need("contact", "contact.phone", "Contact phone", content.contact.phone);
  return missing;
}

export const projectTemplate: ProposalTemplate<ProjectContent, ProjectSection> = {
  type: "project",
  sections: PROJECT_SECTIONS,
  contentSchema: projectContentSchema,
  createDefaultContent: (today: string, studio: StudioDetails) => ({
    projectName: "",
    outcome: "",
    issueDate: today,
    validUntil: addDays(today, PROJECT_VALIDITY_DAYS),
    preparedBy: studio.signatoryName,
    client: { ...EMPTY_CLIENT },
    summary: "",
    highlights: listOf("", "", ""),
    problems: listOf("", "", ""),
    goals: listOf("", "", ""),
    requirements: listOf("", "", ""),
    solution: { approach: "", services: [newService()], whyApproach: "" },
    phases: ["1. Discover", "2. Design", "3. Build", "4. Launch"].map((name) => ({
      id: newRowId(),
      name,
      what: "",
      duration: "",
    })),
    investment: {
      mode: "plans",
      recommended: "standard",
      rows: planRows(
        "Best for",
        "Pages / screens",
        "Design",
        "Features",
        "Revision rounds",
        "Support after launch",
        "Timeline",
      ),
      pricePaise: { premium: 0, standard: 0, basic: 0 },
    },
    thirdParty: [
      { id: newRowId(), item: "Domain name", costPaise: 0, period: "/ year", paidTo: "" },
      { id: newRowId(), item: "Hosting", costPaise: 0, period: "/ year", paidTo: "" },
    ],
    whyBongweb: listOf("", "", ""),
    relevantWork: "",
    kickoffDate: "",
    terms: listOf(...DEFAULT_PROJECT_TERMS),
    contact: {
      name: studio.signatoryName,
      role: studio.signatoryRole,
      phone: studio.phone,
      email: studio.email,
    },
    wording: {},
  }),
  findMissingFields,
  prepareRevision: (content, today) => ({
    ...content,
    issueDate: today,
    validUntil: addDays(today, PROJECT_VALIDITY_DAYS),
  }),
  summarize: (content) => {
    const total = headlinePrice(content.investment);
    return {
      title: content.projectName.trim().slice(0, 120),
      clientName: content.client.business.trim() || content.client.name.trim(),
      issueDate: content.issueDate || null,
      totalPaise: total > 0 ? total : null,
    };
  },
};
