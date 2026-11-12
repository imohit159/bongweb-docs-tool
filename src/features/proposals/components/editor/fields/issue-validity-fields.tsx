"use client";

import { addDays, isIsoDay } from "@/lib/dates";
import { DateField } from "./date-field";

/** Date and Valid until; moving the date keeps the validity window unless it was set by hand. */
export function IssueValidityFields({
  issueDate,
  validUntil,
  days,
  onChange,
  readOnly,
}: {
  issueDate: string;
  validUntil: string;
  days: number;
  onChange: (next: { issueDate: string; validUntil: string }) => void;
  readOnly?: boolean;
}) {
  return (
    <>
      <DateField
        label="Date"
        required
        value={issueDate}
        readOnly={readOnly}
        onChange={(next) => {
          const followed = isIsoDay(issueDate) && validUntil === addDays(issueDate, days);
          onChange({
            issueDate: next,
            validUntil: followed && isIsoDay(next) ? addDays(next, days) : validUntil,
          });
        }}
      />
      <DateField
        label="Valid until"
        required
        value={validUntil}
        readOnly={readOnly}
        description={`Defaults to ${days} days after the date.`}
        onChange={(next) => onChange({ issueDate, validUntil: next })}
      />
    </>
  );
}
