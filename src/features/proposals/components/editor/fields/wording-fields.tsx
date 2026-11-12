"use client";

import { IconRotate } from "@tabler/icons-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { WordingDefinition } from "../../../schema";
import { TextField } from "./text-field";

/** The template's fixed wording, editable per document; blank or reset falls back to the default. */
export function WordingFields<K extends string>({
  definitions,
  overrides,
  onChange,
  readOnly,
}: {
  definitions: Record<K, WordingDefinition>;
  overrides: Partial<Record<K, string>>;
  onChange: (key: K, value: string | undefined) => void;
  readOnly?: boolean;
}) {
  const keys = Object.keys(definitions) as K[];
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="wording">
        <AccordionTrigger>Edit wording</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-4 pt-2">
            {keys.map((key) => {
              const overridden = overrides[key] !== undefined;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <TextField
                    label={definitions[key].label}
                    value={overrides[key] ?? definitions[key].text}
                    multiline={definitions[key].text.length > 60}
                    rows={2}
                    readOnly={readOnly}
                    maxLength={1000}
                    onChange={(value) => onChange(key, value === definitions[key].text ? undefined : value)}
                  />
                  {overridden && !readOnly && (
                    <Button
                      variant="ghost"
                      size="compact"
                      leadingIcon={IconRotate}
                      className="self-start"
                      onClick={() => onChange(key, undefined)}
                    >
                      Reset to default
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
