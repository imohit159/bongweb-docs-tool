"use client";

import { useId } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CharCount } from "./char-count";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  description?: string;
  readOnly?: boolean;
  maxLength?: number;
  type?: "text" | "email" | "tel";
}

export function TextField({
  label,
  value,
  onChange,
  required,
  multiline,
  rows = 3,
  placeholder,
  description,
  readOnly,
  maxLength,
  type = "text",
}: TextFieldProps) {
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
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={maxLength}
          aria-required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={maxLength}
          aria-required={required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {description || (maxLength && value.length >= maxLength * 0.8) ? (
        <div className="flex items-start justify-between gap-3">
          {description ? <FieldDescription>{description}</FieldDescription> : <span />}
          {!readOnly && <CharCount value={value} max={maxLength} className="shrink-0" />}
        </div>
      ) : null}
    </Field>
  );
}
