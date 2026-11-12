"use client";

import type { Draft } from "immer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { newService, type ServiceBlock } from "../../../templates/project";
import { RowControls, moveItem } from "./row-controls";
import { TextField } from "./text-field";

/** One block per service, as in "3. Our solution". */
export function ServiceBlocksField({
  services,
  update,
  readOnly,
}: {
  services: readonly ServiceBlock[];
  update: (recipe: (draft: Draft<ServiceBlock>[]) => void) => void;
  readOnly?: boolean;
}) {
  const set = (index: number, key: Exclude<keyof ServiceBlock, "id">, value: string) =>
    update((draft) => void (draft[index][key] = value));
  return (
    <div className="flex flex-col gap-3">
      {services.map((service, index) => (
        <section
          key={service.id}
          aria-label={`Service ${index + 1}`}
          className="border-border flex flex-col gap-3 rounded-lg border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-medium">Service {index + 1}</span>
            {!readOnly && (
              <RowControls
                index={index}
                count={services.length}
                noun="service"
                onMove={(from, to) => update((draft) => moveItem(draft, from, to))}
                onRemove={(i) => update((draft) => void draft.splice(i, 1))}
              />
            )}
          </div>
          <FieldGroup>
            <TextField
              label="Service name"
              required
              maxLength={120}
              readOnly={readOnly}
              placeholder="Business Website"
              value={service.name}
              onChange={(v) => set(index, "name", v)}
            />
            <TextField
              label="What you get"
              required
              multiline
              rows={3}
              maxLength={600}
              readOnly={readOnly}
              placeholder="5-page website, mobile friendly, contact form, Google Maps, WhatsApp button"
              value={service.whatYouGet}
              onChange={(v) => set(index, "whatYouGet", v)}
            />
            <TextField
              label="Revision rounds"
              maxLength={80}
              readOnly={readOnly}
              placeholder="2 rounds"
              value={service.revisions}
              onChange={(v) => set(index, "revisions", v)}
            />
            <TextField
              label="We need from you"
              multiline
              rows={2}
              maxLength={400}
              readOnly={readOnly}
              placeholder="Logo, photos, page text, domain login"
              value={service.weNeed}
              onChange={(v) => set(index, "weNeed", v)}
            />
            <TextField
              label="Not included"
              multiline
              rows={2}
              maxLength={400}
              readOnly={readOnly}
              placeholder="Content writing, product photography, paid plugins"
              value={service.notIncluded}
              onChange={(v) => set(index, "notIncluded", v)}
            />
          </FieldGroup>
        </section>
      ))}
      {!readOnly && services.length < 8 && (
        <Button
          variant="tertiary"
          leadingIcon={Plus}
          className="self-start"
          onClick={() => update((draft) => void draft.push(newService()))}
        >
          Add service
        </Button>
      )}
    </div>
  );
}
