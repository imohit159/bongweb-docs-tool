"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

/** A number field that lets the text be empty or half-typed ("1.") while editing. */
export function NumberInput({
  value,
  onValueChange,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [synced, setSynced] = useState(value);
  // An outside change (undo, reset) replaces the text; our own edits already match.
  if (value !== synced) {
    setSynced(value);
    if (Number(text) !== value) setText(String(value));
  }
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(event) => {
        const next = event.target.value.replace(/[^\d.]/g, "");
        setText(next);
        const parsed = Number(next);
        if (next !== "" && Number.isFinite(parsed)) {
          setSynced(parsed);
          onValueChange(parsed);
        } else if (next === "") {
          setSynced(0);
          onValueChange(0);
        }
      }}
    />
  );
}
