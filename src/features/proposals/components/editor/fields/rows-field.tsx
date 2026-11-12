"use client";

import type { Draft } from "immer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CharCount } from "./char-count";
import { NumberInput } from "./number-input";
import { RowControls, moveItem } from "./row-controls";

type RowBase = { id: string };

export interface RowColumn<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  /** "money": stored as paise, edited in rupees. */
  kind?: "text" | "money";
  maxLength?: number;
  /** Relative width in the row's grid, e.g. 2 for twice as wide. */
  span?: number;
  /** A text area that grows with its content, for longer text. */
  multiline?: boolean;
}

/** A table-like list of rows (phases, deliverables, third-party costs) with add / reorder / remove. */
export function RowsField<T extends RowBase>({
  rows,
  columns,
  update,
  createRow,
  noun,
  readOnly,
  maxRows = 15,
}: {
  rows: readonly T[];
  columns: RowColumn<T>[];
  update: (recipe: (draft: Draft<T>[]) => void) => void;
  createRow: () => T;
  noun: string;
  readOnly?: boolean;
  maxRows?: number;
}) {
  const template = columns.map((c) => `${c.span ?? 1}fr`).join(" ");
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <li key={row.id} className="border-border flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-medium capitalize tabular-nums">
                {noun} {index + 1}
              </span>
              {!readOnly && (
                <RowControls
                  index={index}
                  count={rows.length}
                  noun={noun}
                  onMove={(from, to) => update((draft) => moveItem(draft, from, to))}
                  onRemove={(i) => update((draft) => void draft.splice(i, 1))}
                />
              )}
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: template }}>
              {columns.map((column) => {
                const label = `${noun} ${index + 1} ${column.label}`;
                if (column.kind === "money") {
                  const paise = row[column.key] as unknown as number;
                  return (
                    <NumberInput
                      key={column.key}
                      aria-label={`${label} in rupees`}
                      placeholder={column.placeholder ?? column.label}
                      value={paise / 100}
                      readOnly={readOnly}
                      onValueChange={(rupees) =>
                        update((draft) => {
                          (draft[index] as Record<string, unknown>)[column.key] = Math.min(
                            Math.round(rupees * 100),
                            1_000_000_000_00,
                          );
                        })
                      }
                    />
                  );
                }
                const text = row[column.key] as unknown as string;
                const onChange = (value: string) =>
                  update((draft) => {
                    (draft[index] as Record<string, unknown>)[column.key] = value;
                  });
                return (
                  <div key={column.key} className="flex min-w-0 flex-col gap-1">
                    {column.multiline ? (
                      <Textarea
                        aria-label={label}
                        placeholder={column.placeholder ?? column.label}
                        value={text}
                        readOnly={readOnly}
                        maxLength={column.maxLength}
                        rows={1}
                        className="min-h-9"
                        onChange={(event) => onChange(event.target.value)}
                      />
                    ) : (
                      <Input
                        aria-label={label}
                        placeholder={column.placeholder ?? column.label}
                        value={text}
                        readOnly={readOnly}
                        maxLength={column.maxLength}
                        onChange={(event) => onChange(event.target.value)}
                      />
                    )}
                    {!readOnly && <CharCount value={text} max={column.maxLength} />}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      {!readOnly && rows.length < maxRows && (
        <Button
          variant="tertiary"
          leadingIcon={Plus}
          className="self-start"
          onClick={() => update((draft) => void draft.push(createRow() as Draft<T>))}
        >
          Add {noun}
        </Button>
      )}
    </div>
  );
}
