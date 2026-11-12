"use client";

import type { WordingDefinition } from "../../../schema";
import { WordingFields } from "./wording-fields";

/** "Edit wording" for a subset of a template's wording keys. */
export function TemplateWording<K extends string>({
  all,
  keys,
  overrides,
  onChange,
  readOnly,
}: {
  all: Record<K, WordingDefinition>;
  keys: K[];
  overrides: Partial<Record<K, string>>;
  onChange: (key: K, value: string | undefined) => void;
  readOnly?: boolean;
}) {
  const definitions = Object.fromEntries(keys.map((key) => [key, all[key]])) as Record<K, WordingDefinition>;
  return (
    <WordingFields definitions={definitions} overrides={overrides} onChange={onChange} readOnly={readOnly} />
  );
}

/** Applies a wording edit to a draft: undefined removes the override. */
export function setWording<K extends string>(
  wording: Partial<Record<K, string>>,
  key: K,
  value: string | undefined,
) {
  if (value === undefined) delete wording[key];
  else wording[key] = value;
}
