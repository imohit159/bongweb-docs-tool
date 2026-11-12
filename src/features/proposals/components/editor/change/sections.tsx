"use client";

import type { ComponentType } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { STUDIO_NAME, howToPay } from "@/features/studio/schema";
import { formatDocDate } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { CHANGE_WORDING, type ChangeSection } from "../../../templates/change";
import { itemsTotal } from "../../../templates/quotation";
import { useEditor, useTemplateEditor } from "../editor-store";
import { ClientFields } from "../fields/client-fields";
import { DateField } from "../fields/date-field";
import { LineItemsField } from "../fields/line-items-field";
import { TemplateWording, setWording } from "../fields/template-wording";
import { TextField } from "../fields/text-field";

const useChange = () => useTemplateEditor<"change">();
const MANUAL = "manual";

function DetailsSection() {
  const { content, update, readOnly } = useChange();
  const number = useEditor((s) => s.proposal.number);
  return (
    <FieldGroup>
      <TextField
        label="Change request No."
        value={number}
        onChange={() => {}}
        readOnly
        description="Assigned automatically."
      />
      <DateField
        label="Date"
        required
        value={content.issueDate}
        readOnly={readOnly}
        onChange={(v) => update((d) => void (d.issueDate = v))}
      />
    </FieldGroup>
  );
}

function OriginalSection() {
  const { content, update, readOnly } = useChange();
  const projects = useEditor((s) => s.lookups.acceptedProjects);
  const linked = projects.find((p) => p.id === content.original.proposalId);
  const selected = content.original.proposalId || MANUAL;

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Original proposal</FieldLabel>
        <Select
          value={selected}
          disabled={readOnly}
          onValueChange={(value) =>
            update((draft) => {
              if (value === MANUAL) {
                draft.original.proposalId = "";
                return;
              }
              const project = projects.find((p) => p.id === value);
              if (!project) return;
              // Picking a project fills everything the document repeats from it.
              draft.original = {
                proposalId: project.id,
                number: project.number,
                date: project.issueDate ?? "",
              };
              draft.projectName = project.projectName;
              draft.client = { ...project.client };
            })
          }
        >
          <SelectTrigger aria-label="Original proposal" />
          <SelectContent>
            <SelectItem index={0} value={MANUAL}>
              Not in the app (enter details)
            </SelectItem>
            {projects.map((project, index) => (
              <SelectItem key={project.id} index={index + 1} value={project.id}>
                {project.number} · {project.projectName || "Untitled"} ·{" "}
                {project.client.business || project.client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          {projects.length
            ? "Accepted Project Proposals. Picking one fills the client and project."
            : "No accepted Project Proposals yet. Enter the original's details below."}
        </FieldDescription>
      </Field>
      <TextField
        label="Original proposal number"
        required
        maxLength={40}
        readOnly={readOnly || Boolean(linked)}
        placeholder="BW-P-001"
        value={content.original.number}
        onChange={(v) => update((d) => void (d.original.number = v))}
      />
      <DateField
        label="Original proposal date"
        required
        readOnly={readOnly || Boolean(linked)}
        value={content.original.date}
        onChange={(v) => update((d) => void (d.original.date = v))}
      />
      <TextField
        label="Project"
        required
        maxLength={160}
        readOnly={readOnly}
        placeholder="Lotus Salon website"
        value={content.projectName}
        onChange={(v) => update((d) => void (d.projectName = v))}
      />
      <ClientFields
        client={content.client}
        readOnly={readOnly}
        onChange={(key, value) => update((d) => void (d.client[key] = value))}
      />
    </FieldGroup>
  );
}

function ChangeSectionFields() {
  const { content, update, readOnly } = useChange();
  return (
    <TextField
      label="What's changing"
      required
      multiline
      rows={5}
      maxLength={1200}
      readOnly={readOnly}
      placeholder="Add an online booking page with payment, not part of the original scope."
      description="Two or three lines describing the requested change."
      value={content.change}
      onChange={(v) => update((d) => void (d.change = v))}
    />
  );
}

function CostSection() {
  const { content, update, readOnly } = useChange();
  return (
    <div className="flex flex-col gap-3">
      <LineItemsField
        items={content.items}
        readOnly={readOnly}
        update={(recipe) => update((d) => recipe(d.items))}
      />
      <p className="text-muted-foreground text-xs">
        GST not applicable: {STUDIO_NAME} is not registered under GST.
      </p>
    </div>
  );
}

function TimelineSection() {
  const { content, update, readOnly } = useChange();
  return (
    <FieldGroup>
      <TextField
        label="Extra time"
        required
        maxLength={20}
        readOnly={readOnly}
        placeholder="+7 days"
        value={content.timeline.extraTime}
        onChange={(v) => update((d) => void (d.timeline.extraTime = v))}
      />
      <DateField
        label="New delivery"
        required
        value={content.timeline.newDelivery}
        readOnly={readOnly}
        onChange={(v) => update((d) => void (d.timeline.newDelivery = v))}
      />
      <DateField
        label="Was (previous delivery)"
        required
        value={content.timeline.previousDelivery}
        readOnly={readOnly}
        onChange={(v) => update((d) => void (d.timeline.previousDelivery = v))}
      />
    </FieldGroup>
  );
}

function PaymentSection() {
  const { content, update, readOnly } = useChange();
  const studio = useEditor((s) => s.studio);
  const pay = howToPay(studio);
  return (
    <div className="flex flex-col gap-4">
      <dl className="border-border flex items-baseline justify-between rounded-lg border px-3 py-2.5 text-sm">
        <dt className="flex flex-col">
          <span className="font-medium">100% before the change work starts</span>
          <span className="text-muted-foreground text-xs">From the template&apos;s payment terms</span>
        </dt>
        <dd className="tabular-nums">{formatInr(itemsTotal(content.items))}</dd>
      </dl>
      <p className="text-sm">
        <span className="text-muted-foreground">How to pay: </span>
        {pay || <span className="text-muted-foreground">add UPI or bank details in Studio details</span>}
      </p>
      <p className="text-muted-foreground text-xs">
        Signed for {STUDIO_NAME} by {studio.signatoryName || "the signatory set in Studio details"}.
        {content.original.date ? ` Amends the proposal dated ${formatDocDate(content.original.date)}.` : ""}
      </p>
      <TemplateWording
        all={CHANGE_WORDING}
        keys={["payment", "approval"]}
        overrides={content.wording}
        readOnly={readOnly}
        onChange={(key, value) => update((d) => setWording(d.wording, key, value))}
      />
    </div>
  );
}

export const CHANGE_SECTION_COMPONENTS: Record<ChangeSection, ComponentType> = {
  details: DetailsSection,
  original: OriginalSection,
  change: ChangeSectionFields,
  cost: CostSection,
  timeline: TimelineSection,
  payment: PaymentSection,
};
