"use client";

import { useId } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { isIsoDay, isoDayToLocalDate, localDateToIsoDay } from "@/lib/dates";

export function DateField({
  label,
  value,
  onChange,
  required,
  description,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  description?: string;
  readOnly?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden className="text-muted-foreground">
            {" "}
            *
          </span>
        ) : null}
      </FieldLabel>
      <DatePicker
        id={id}
        value={isIsoDay(value) ? isoDayToLocalDate(value) : undefined}
        onValueChange={(date) => onChange(date ? localDateToIsoDay(date) : "")}
        placeholder="Pick a date"
        disabled={readOnly}
        typeable
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
