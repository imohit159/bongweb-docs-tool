"use client";

import type { ComponentType } from "react";
import { FieldGroup } from "@/components/ui/field";
import { howToPay } from "@/features/studio/schema";
import { newRowId } from "../../../schema";
import {
  RETAINER_VALIDITY_DAYS,
  RETAINER_WORDING,
  generatedRetainerTerms,
  type RetainerSection,
} from "../../../templates/retainer";
import { useEditor, useTemplateEditor } from "../editor-store";
import { ClientFields } from "../fields/client-fields";
import { DateField } from "../fields/date-field";
import { IssueValidityFields } from "../fields/issue-validity-fields";
import { ListField } from "../fields/list-field";
import { NumberInput } from "../fields/number-input";
import { PlanComparisonField } from "../fields/plan-comparison-field";
import { RowsField } from "../fields/rows-field";
import { TemplateWording, setWording } from "../fields/template-wording";
import { TextField } from "../fields/text-field";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

const useRetainer = () => useTemplateEditor<"retainer">();

function Wording({ keys }: { keys: (keyof typeof RETAINER_WORDING)[] }) {
  const { content, update, readOnly } = useRetainer();
  return (
    <TemplateWording
      all={RETAINER_WORDING}
      keys={keys}
      overrides={content.wording}
      readOnly={readOnly}
      onChange={(key, value) => update((d) => setWording(d.wording, key, value))}
    />
  );
}

function WholeNumberField({
  label,
  value,
  min,
  max,
  description,
  readOnly,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  description?: string;
  readOnly?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <NumberInput
        aria-label={label}
        value={value}
        readOnly={readOnly}
        onValueChange={(n) => onChange(Math.min(max, Math.max(min, Math.round(n) || min)))}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function DetailsSection() {
  const { content, update, readOnly } = useRetainer();
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
      <IssueValidityFields
        issueDate={content.issueDate}
        validUntil={content.validUntil}
        days={RETAINER_VALIDITY_DAYS}
        readOnly={readOnly}
        onChange={(next) => update((d) => void Object.assign(d, next))}
      />
    </FieldGroup>
  );
}

function ClientSection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <ClientFields
      client={content.client}
      readOnly={readOnly}
      onChange={(key, value) => update((d) => void (d.client[key] = value))}
    />
  );
}

function SummarySection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <FieldGroup>
      <TextField
        label="Summary"
        required
        multiline
        rows={4}
        maxLength={1200}
        readOnly={readOnly}
        placeholder="Monthly social media management to keep your salon visible and bring in enquiries."
        description="What we will do every month and why it helps the client."
        value={content.summary}
        onChange={(v) => update((d) => void (d.summary = v))}
      />
      <DateField
        label="Start date"
        required
        value={content.startDate}
        readOnly={readOnly}
        onChange={(v) => update((d) => void (d.startDate = v))}
      />
      <WholeNumberField
        label="Minimum term (months)"
        value={content.minimumTermMonths}
        min={1}
        max={36}
        readOnly={readOnly}
        description="Also used in the terms: after this, 30 days' written notice to stop."
        onChange={(n) => update((d) => void (d.minimumTermMonths = n))}
      />
    </FieldGroup>
  );
}

function DeliverablesSection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <FieldGroup>
      <RowsField
        rows={content.deliverables}
        noun="deliverable"
        readOnly={readOnly}
        maxRows={15}
        createRow={() => ({ id: newRowId(), item: "", perMonth: "" })}
        update={(recipe) => update((d) => recipe(d.deliverables))}
        columns={[
          {
            key: "item",
            label: "Deliverable",
            placeholder: "Social media posts and carousels with captions",
            maxLength: 200,
            span: 3,
            multiline: true,
          },
          { key: "perMonth", label: "Per month", placeholder: "12", maxLength: 20 },
        ]}
      />
      <TextField
        label="Why this approach"
        required
        multiline
        rows={3}
        maxLength={1200}
        readOnly={readOnly}
        description="Why a monthly retainer is the right fit for this client."
        value={content.whyApproach}
        onChange={(v) => update((d) => void (d.whyApproach = v))}
      />
      <Wording keys={["unusedNote"]} />
    </FieldGroup>
  );
}

function PlansSection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <PlanComparisonField
      plans={content.plans}
      priceLabel="Monthly fee"
      readOnly={readOnly}
      update={(recipe) => update((d) => recipe(d.plans))}
    />
  );
}

function ReportingSection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <FieldGroup>
      <TextField
        label="Every"
        maxLength={40}
        readOnly={readOnly}
        placeholder="month"
        description="Printed as “Every month you receive …”."
        value={content.reporting.frequency}
        onChange={(v) => update((d) => void (d.reporting.frequency = v))}
      />
      <TextField
        label="You receive"
        required
        multiline
        rows={3}
        maxLength={600}
        readOnly={readOnly}
        placeholder="a one-page report covering posts published, reach, engagement and next month’s plan"
        value={content.reporting.description}
        onChange={(v) => update((d) => void (d.reporting.description = v))}
      />
    </FieldGroup>
  );
}

function NotIncludedSection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <FieldGroup>
      <ListField
        label="Not included"
        noun="item"
        maxItems={10}
        readOnly={readOnly}
        placeholder="Paid ad spend"
        items={content.notIncluded}
        update={(recipe) => update((d) => recipe(d.notIncluded))}
      />
      <Wording keys={["aboutResults"]} />
    </FieldGroup>
  );
}

function NextStepsSection() {
  const { content, update, readOnly } = useRetainer();
  return (
    <FieldGroup>
      <DateField
        label="Onboarding call"
        required
        description="Step 4 of the next steps."
        value={content.onboardingDate}
        readOnly={readOnly}
        onChange={(v) => update((d) => void (d.onboardingDate = v))}
      />
      <Wording keys={["nextStep1", "nextStep2", "nextStep3"]} />
    </FieldGroup>
  );
}

function TermsSection() {
  const { content, update, readOnly } = useRetainer();
  const studio = useEditor((s) => s.studio);
  return (
    <FieldGroup>
      <WholeNumberField
        label="Fee due by (day of month)"
        value={content.feeDueDay}
        min={1}
        max={28}
        readOnly={readOnly}
        onChange={(n) => update((d) => void (d.feeDueDay = n))}
      />
      <div className="bg-muted/50 flex flex-col gap-1.5 rounded-lg p-3 text-sm">
        <span className="text-muted-foreground text-xs font-medium">
          Printed first, from the fields above
        </span>
        {generatedRetainerTerms(content).map((term) => (
          <p key={term}>• {term}</p>
        ))}
      </div>
      <ListField
        label="Other terms"
        noun="term"
        maxItems={12}
        maxLength={400}
        readOnly={readOnly}
        items={content.terms}
        update={(recipe) => update((d) => recipe(d.terms))}
      />
      <p className="text-muted-foreground text-xs">
        How to pay: {howToPay(studio) || "add UPI or bank details in Studio details"}.
      </p>
    </FieldGroup>
  );
}

export const RETAINER_SECTION_COMPONENTS: Record<RetainerSection, ComponentType> = {
  details: DetailsSection,
  client: ClientSection,
  summary: SummarySection,
  deliverables: DeliverablesSection,
  plans: PlansSection,
  reporting: ReportingSection,
  notIncluded: NotIncludedSection,
  nextSteps: NextStepsSection,
  terms: TermsSection,
};
