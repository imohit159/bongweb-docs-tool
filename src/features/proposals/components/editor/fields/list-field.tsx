"use client";

import type { Draft } from "immer";
import { Plus } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { newRowId, type ListItem } from "../../../schema";
import { RowControls, moveItem } from "./row-controls";

/** A bullet list: one input per item, with add / reorder / remove. */
export function ListField({
  label,
  items,
  update,
  placeholder,
  description,
  required,
  readOnly,
  maxItems = 12,
  maxLength = 300,
  noun = "item",
}: {
  label: string;
  items: readonly ListItem[];
  update: (recipe: (draft: Draft<ListItem>[]) => void) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  readOnly?: boolean;
  maxItems?: number;
  maxLength?: number;
  noun?: string;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={`${id}-0`}>
        {label}
        {required ? (
          <span aria-hidden className="text-muted-foreground">
            {" "}
            *
          </span>
        ) : null}
      </FieldLabel>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-1">
            <Input
              id={`${id}-${index}`}
              aria-label={`${label} ${index + 1}`}
              value={item.text}
              placeholder={placeholder}
              readOnly={readOnly}
              maxLength={maxLength}
              onChange={(event) => update((draft) => void (draft[index].text = event.target.value))}
            />
            {!readOnly && (
              <RowControls
                index={index}
                count={items.length}
                noun={noun}
                onMove={(from, to) => update((draft) => moveItem(draft, from, to))}
                onRemove={(i) => update((draft) => void draft.splice(i, 1))}
              />
            )}
          </li>
        ))}
      </ul>
      {!readOnly && items.length < maxItems && (
        <Button
          variant="ghost"
          size="compact"
          leadingIcon={Plus}
          className="self-start"
          onClick={() => update((draft) => void draft.push({ id: newRowId(), text: "" }))}
        >
          Add {noun}
        </Button>
      )}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
