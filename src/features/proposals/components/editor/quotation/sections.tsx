"use client";

import type { ComponentType } from "react";
import { FieldGroup } from "@/components/ui/field";
import { STUDIO_NAME, howToPay } from "@/features/studio/schema";
import { addDays, formatDocDate, isIsoDay } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import {
  QUOTATION_PAYMENT_PERCENTS,
  QUOTATION_VALIDITY_DAYS,
  QUOTATION_WORDING,
  quotationPayment,
  type QuotationSection,
  type QuotationWordingKey,
} from "../../../templates/quotation";
import { useEditor, useTemplateEditor } from "../editor-store";
import { ClientFields } from "../fields/client-fields";
import { DateField } from "../fields/date-field";
import { LineItemsField } from "../fields/line-items-field";
import { TextField } from "../fields/text-field";
import { WordingFields } from "../fields/wording-fields";

const useQuotation = () => useTemplateEditor<"quotation">();

function Wording({ keys }: { keys: QuotationWordingKey[] }) {
  const { content, update, readOnly } = useQuotation();
  const definitions = Object.fromEntries(keys.map((key) => [key, QUOTATION_WORDING[key]])) as Record<
    QuotationWordingKey,
    (typeof QUOTATION_WORDING)[QuotationWordingKey]
  >;
  return (
    <WordingFields
      definitions={definitions}
      overrides={content.wording}
      readOnly={readOnly}
      onChange={(key, value) =>
        update((draft) => {
          if (value === undefined) delete draft.wording[key];
          else draft.wording[key] = value;
        })
      }
    />
  );
}

function DetailsSection() {
  const { content, update, readOnly } = useQuotation();
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
      <DateField
        label="Date"
        required
        value={content.issueDate}
        readOnly={readOnly}
        onChange={(issueDate) =>
          update((draft) => {
            // Keep the validity window when the date moves, unless it was set by hand.
            const followed =
              isIsoDay(draft.issueDate) &&
              draft.validUntil === addDays(draft.issueDate, QUOTATION_VALIDITY_DAYS);
            draft.issueDate = issueDate;
            if (followed && isIsoDay(issueDate))
              draft.validUntil = addDays(issueDate, QUOTATION_VALIDITY_DAYS);
          })
        }
      />
      <DateField
        label="Valid until"
        required
        value={content.validUntil}
        readOnly={readOnly}
        description={`Defaults to ${QUOTATION_VALIDITY_DAYS} days after the date.`}
        onChange={(validUntil) => update((draft) => void (draft.validUntil = validUntil))}
      />
    </FieldGroup>
  );
}

function ClientSection() {
  const { content, update, readOnly } = useQuotation();
  return (
    <ClientFields
      client={content.client}
      readOnly={readOnly}
      onChange={(key, value) => update((draft) => void (draft.client[key] = value))}
    />
  );
}

function WorkSection() {
  const { content, update, readOnly } = useQuotation();
  return (
    <FieldGroup>
      <TextField
        label="What we will do"
        required
        multiline
        rows={4}
        maxLength={1200}
        readOnly={readOnly}
        placeholder="Design and build a one-page website for your salon with a booking button linked to WhatsApp."
        description="Two or three lines."
        value={content.work.description}
        onChange={(value) => update((draft) => void (draft.work.description = value))}
      />
      <TextField
        label="Included"
        required
        multiline
        rows={2}
        maxLength={600}
        readOnly={readOnly}
        placeholder="One-page website, WhatsApp booking button, 2 revision rounds"
        value={content.work.included}
        onChange={(value) => update((draft) => void (draft.work.included = value))}
      />
      <TextField
        label="Not included"
        required
        multiline
        rows={2}
        maxLength={600}
        readOnly={readOnly}
        placeholder="Domain and hosting fees, content writing"
        value={content.work.notIncluded}
        onChange={(value) => update((draft) => void (draft.work.notIncluded = value))}
      />
      <Wording keys={["notIncludedSuffix"]} />
    </FieldGroup>
  );
}

function PriceSection() {
  const { content, update, readOnly } = useQuotation();
  return (
    <div className="flex flex-col gap-3">
      <LineItemsField
        items={content.items}
        readOnly={readOnly}
        update={(recipe) => update((draft) => recipe(draft.items))}
      />
      <p className="text-muted-foreground text-xs">
        GST not applicable: {STUDIO_NAME} is not registered under GST.
      </p>
    </div>
  );
}

function TimelineSection() {
  const { content, update, readOnly } = useQuotation();
  return (
    <FieldGroup>
      <DateField
        label="Start"
        required
        description="Work starts after the advance is received."
        value={content.timeline.start}
        readOnly={readOnly}
        onChange={(start) => update((draft) => void (draft.timeline.start = start))}
      />
      <DateField
        label="Delivery"
        required
        value={content.timeline.delivery}
        readOnly={readOnly}
        onChange={(delivery) => update((draft) => void (draft.timeline.delivery = delivery))}
      />
      <TextField
        label="We need from you"
        required
        multiline
        rows={2}
        maxLength={400}
        readOnly={readOnly}
        placeholder="Logo, photos, text, logins, by 18 Nov 2026"
        value={content.timeline.weNeed}
        onChange={(value) => update((draft) => void (draft.timeline.weNeed = value))}
      />
      <Wording keys={["startNote"]} />
    </FieldGroup>
  );
}

function PaymentSection() {
  const { content } = useQuotation();
  const studio = useEditor((s) => s.studio);
  const { advance, balance } = quotationPayment(content);
  const [advancePct, balancePct] = QUOTATION_PAYMENT_PERCENTS;
  const wording = (key: QuotationWordingKey) => content.wording[key]?.trim() || QUOTATION_WORDING[key].text;
  const pay = howToPay(studio);
  return (
    <div className="flex flex-col gap-4">
      <dl className="border-border divide-border flex flex-col divide-y rounded-lg border text-sm">
        {[
          [`${advancePct}% advance`, advance, wording("advanceWhen")],
          [`${balancePct}% balance`, balance, wording("balanceWhen")],
        ].map(([label, amount, when]) => (
          <div key={label as string} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
            <dt className="flex flex-col">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground text-xs">{when}</span>
            </dt>
            <dd className="tabular-nums">{formatInr(amount as number)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm">
        <span className="text-muted-foreground">How to pay: </span>
        {pay || <span className="text-muted-foreground">add UPI or bank details in Studio details</span>}
      </p>
      <p className="text-muted-foreground text-xs">
        Amounts follow the total. Payment terms come from the template.
      </p>
      <Wording keys={["advanceWhen", "balanceWhen"]} />
    </div>
  );
}

function AcceptanceSection() {
  const { content } = useQuotation();
  const studio = useEditor((s) => s.studio);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{content.wording.toAccept?.trim() || QUOTATION_WORDING.toAccept.text}</p>
      <p className="text-muted-foreground text-xs">
        Signed for {STUDIO_NAME} by {studio.signatoryName || "the signatory set in Studio details"}.
        {content.validUntil ? ` Valid until ${formatDocDate(content.validUntil)}.` : ""}
      </p>
      <Wording keys={["toAccept"]} />
    </div>
  );
}

export const QUOTATION_SECTION_COMPONENTS: Record<QuotationSection, ComponentType> = {
  details: DetailsSection,
  client: ClientSection,
  work: WorkSection,
  price: PriceSection,
  timeline: TimelineSection,
  payment: PaymentSection,
  acceptance: AcceptanceSection,
};
