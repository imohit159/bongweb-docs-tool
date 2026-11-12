"use client";

import type { ComponentType } from "react";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { howToPay } from "@/features/studio/schema";
import { formatInr } from "@/lib/money";
import { newRowId } from "../../../schema";
import {
  PROJECT_VALIDITY_DAYS,
  PROJECT_WORDING,
  projectPayment,
  type ProjectContent,
  type ProjectSection,
} from "../../../templates/project";
import { useEditor, useTemplateEditor } from "../editor-store";
import { ClientFields } from "../fields/client-fields";
import { DateField } from "../fields/date-field";
import { IssueValidityFields } from "../fields/issue-validity-fields";
import { ListField } from "../fields/list-field";
import { PlanComparisonField } from "../fields/plan-comparison-field";
import { RowsField } from "../fields/rows-field";
import { ServiceBlocksField } from "../fields/service-blocks-field";
import { TemplateWording, setWording } from "../fields/template-wording";
import { TextField } from "../fields/text-field";

const useProject = () => useTemplateEditor<"project">();

function Wording({ keys }: { keys: (keyof typeof PROJECT_WORDING)[] }) {
  const { content, update, readOnly } = useProject();
  return (
    <TemplateWording
      all={PROJECT_WORDING}
      keys={keys}
      overrides={content.wording}
      readOnly={readOnly}
      onChange={(key, value) => update((d) => setWording(d.wording, key, value))}
    />
  );
}

function DetailsSection() {
  const { content, update, readOnly } = useProject();
  const number = useEditor((s) => s.proposal.number);
  return (
    <FieldGroup>
      <TextField
        label="Number"
        value={number}
        onChange={() => {}}
        readOnly
        description="Assigned automatically."
      />
      <TextField
        label="Project name"
        required
        maxLength={160}
        readOnly={readOnly}
        placeholder="Lotus Salon website"
        value={content.projectName}
        onChange={(v) => update((d) => void (d.projectName = v))}
      />
      <TextField
        label="One-line outcome"
        required
        maxLength={200}
        readOnly={readOnly}
        placeholder="A new website that brings Lotus Salon more bookings"
        value={content.outcome}
        onChange={(v) => update((d) => void (d.outcome = v))}
      />
      <IssueValidityFields
        issueDate={content.issueDate}
        validUntil={content.validUntil}
        days={PROJECT_VALIDITY_DAYS}
        readOnly={readOnly}
        onChange={(next) => update((d) => void Object.assign(d, next))}
      />
    </FieldGroup>
  );
}

function ClientSection() {
  const { content, update, readOnly } = useProject();
  return (
    <ClientFields
      client={content.client}
      readOnly={readOnly}
      onChange={(key, value) => update((d) => void (d.client[key] = value))}
    />
  );
}

function SummarySection() {
  const { content, update, readOnly } = useProject();
  return (
    <FieldGroup>
      <TextField
        label="Summary"
        required
        multiline
        rows={8}
        maxLength={2400}
        readOnly={readOnly}
        description="Half a page: what the client wants, what we will build, and the result. Write this last."
        value={content.summary}
        onChange={(v) => update((d) => void (d.summary = v))}
      />
      <ListField
        label="Key highlights"
        required
        noun="highlight"
        maxItems={6}
        maxLength={200}
        readOnly={readOnly}
        placeholder="Customers can book online 24/7"
        items={content.highlights}
        update={(recipe) => update((d) => recipe(d.highlights))}
      />
    </FieldGroup>
  );
}

function ProblemsSection() {
  const { content, update, readOnly } = useProject();
  const list =
    (key: "problems" | "goals" | "requirements") => (recipe: (items: ProjectContent[typeof key]) => void) =>
      update((d) => recipe(d[key]));
  return (
    <FieldGroup>
      <ListField
        label="Problems we noticed"
        required
        noun="problem"
        maxItems={8}
        readOnly={readOnly}
        placeholder="Bookings come only by phone and are missed after hours"
        items={content.problems}
        update={list("problems")}
      />
      <ListField
        label="What you want to achieve"
        required
        noun="goal"
        maxItems={8}
        readOnly={readOnly}
        placeholder="More bookings from new customers"
        items={content.goals}
        update={list("goals")}
      />
      <ListField
        label="Key requirements"
        required
        noun="requirement"
        maxItems={8}
        readOnly={readOnly}
        placeholder="Works well on mobile"
        items={content.requirements}
        update={list("requirements")}
      />
    </FieldGroup>
  );
}

function SolutionSection() {
  const { content, update, readOnly } = useProject();
  return (
    <FieldGroup>
      <TextField
        label="Approach"
        required
        multiline
        rows={3}
        maxLength={800}
        readOnly={readOnly}
        description="Two or three lines on the overall approach and why it fits this client."
        value={content.solution.approach}
        onChange={(v) => update((d) => void (d.solution.approach = v))}
      />
      <FieldSet>
        <FieldLegend>Services</FieldLegend>
        <ServiceBlocksField
          services={content.solution.services}
          readOnly={readOnly}
          update={(recipe) => update((d) => recipe(d.solution.services))}
        />
      </FieldSet>
      <TextField
        label="Why this approach"
        required
        multiline
        rows={3}
        maxLength={1200}
        readOnly={readOnly}
        description="Why this solution is the best fit for this client, not just what it is."
        value={content.solution.whyApproach}
        onChange={(v) => update((d) => void (d.solution.whyApproach = v))}
      />
    </FieldGroup>
  );
}

function TimelineSection() {
  const { content, update, readOnly } = useProject();
  return (
    <RowsField
      rows={content.phases}
      noun="phase"
      readOnly={readOnly}
      maxRows={10}
      createRow={() => ({ id: newRowId(), name: `${content.phases.length + 1}. `, what: "", duration: "" })}
      update={(recipe) => update((d) => recipe(d.phases))}
      columns={[
        { key: "name", label: "Phase", placeholder: "1. Discover", maxLength: 30 },
        {
          key: "what",
          label: "What happens",
          placeholder: "Kick-off call, collect content",
          maxLength: 300,
          span: 2,
          multiline: true,
        },
        { key: "duration", label: "Duration", placeholder: "Week 1", maxLength: 20 },
      ]}
    />
  );
}

function InvestmentSection() {
  const { content, update, readOnly } = useProject();
  const studio = useEditor((s) => s.studio);
  const { total, milestones } = projectPayment(content);
  return (
    <div className="flex flex-col gap-5">
      <PlanComparisonField
        plans={content.investment}
        priceLabel="Price"
        readOnly={readOnly}
        update={(recipe) => update((d) => recipe(d.investment))}
      />
      <section aria-label="Payment breakdown" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Payment breakdown</h3>
        <dl className="border-border divide-border flex flex-col divide-y rounded-lg border text-sm">
          {milestones.map((m) => (
            <div key={m.key} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
              <dt className="flex flex-col">
                <span className="font-medium">
                  {m.label} · {m.percent}%
                </span>
                <span className="text-muted-foreground text-xs">{m.when}</span>
              </dt>
              <dd className="tabular-nums">{formatInr(m.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between px-3 py-2.5 font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatInr(total)}</dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-xs">
          Follows the {content.investment.mode === "single" ? "fixed" : "recommended plan's"} price. How to
          pay: {howToPay(studio) || "add UPI or bank details in Studio details"}.
        </p>
      </section>
      <Wording keys={["investmentIntro", "finalFilesNote"]} />
    </div>
  );
}

function ThirdPartySection() {
  const { content, update, readOnly } = useProject();
  return (
    <div className="flex flex-col gap-4">
      <RowsField
        rows={content.thirdParty}
        noun="cost"
        readOnly={readOnly}
        maxRows={10}
        createRow={() => ({ id: newRowId(), item: "", costPaise: 0, period: "", paidTo: "" })}
        update={(recipe) => update((d) => recipe(d.thirdParty))}
        columns={[
          {
            key: "item",
            label: "Item",
            placeholder: "Domain name",
            maxLength: 120,
            span: 2,
            multiline: true,
          },
          { key: "costPaise", label: "Approx. cost (₹)", kind: "money" },
          { key: "period", label: "Period", placeholder: "/ year", maxLength: 12 },
          { key: "paidTo", label: "Paid to", placeholder: "Provider", maxLength: 60 },
        ]}
      />
      <Wording keys={["thirdPartyIntro"]} />
    </div>
  );
}

function WhyUsSection() {
  const { content, update, readOnly } = useProject();
  return (
    <FieldGroup>
      <ListField
        label="Reasons"
        required
        noun="reason"
        maxItems={6}
        readOnly={readOnly}
        placeholder="One contact person from start to handover"
        items={content.whyBongweb}
        update={(recipe) => update((d) => recipe(d.whyBongweb))}
      />
      <TextField
        label="Relevant work"
        multiline
        rows={3}
        maxLength={800}
        readOnly={readOnly}
        description="One or two work samples with a link. Label concept work as concept."
        value={content.relevantWork}
        onChange={(v) => update((d) => void (d.relevantWork = v))}
      />
    </FieldGroup>
  );
}

function NextStepsSection() {
  const { content, update, readOnly } = useProject();
  return (
    <FieldGroup>
      <DateField
        label="Kick-off call"
        required
        description="Step 4 of the next steps."
        value={content.kickoffDate}
        readOnly={readOnly}
        onChange={(v) => update((d) => void (d.kickoffDate = v))}
      />
      <Wording keys={["nextStep1", "nextStep2", "nextStep3"]} />
    </FieldGroup>
  );
}

function TermsSection() {
  const { content, update, readOnly } = useProject();
  return (
    <ListField
      label="Terms and conditions"
      noun="term"
      maxItems={12}
      maxLength={400}
      readOnly={readOnly}
      description="Starts with the template's terms; edit, add or remove for this client."
      items={content.terms}
      update={(recipe) => update((d) => recipe(d.terms))}
    />
  );
}

function ContactSection() {
  const { content, update, readOnly } = useProject();
  const set = (key: keyof ProjectContent["contact"]) => (v: string) =>
    update((d) => void (d.contact[key] = v));
  return (
    <FieldGroup>
      <TextField
        label="Name"
        required
        maxLength={120}
        readOnly={readOnly}
        value={content.contact.name}
        onChange={set("name")}
      />
      <TextField
        label="Role"
        maxLength={80}
        readOnly={readOnly}
        value={content.contact.role}
        onChange={set("role")}
      />
      <TextField
        label="Phone"
        type="tel"
        required
        maxLength={40}
        readOnly={readOnly}
        value={content.contact.phone}
        onChange={set("phone")}
      />
      <TextField
        label="Email"
        type="email"
        maxLength={160}
        readOnly={readOnly}
        value={content.contact.email}
        onChange={set("email")}
      />
    </FieldGroup>
  );
}

export const PROJECT_SECTION_COMPONENTS: Record<ProjectSection, ComponentType> = {
  details: DetailsSection,
  client: ClientSection,
  summary: SummarySection,
  problems: ProblemsSection,
  solution: SolutionSection,
  timeline: TimelineSection,
  investment: InvestmentSection,
  thirdParty: ThirdPartySection,
  whyUs: WhyUsSection,
  nextSteps: NextStepsSection,
  terms: TermsSection,
  contact: ContactSection,
};
