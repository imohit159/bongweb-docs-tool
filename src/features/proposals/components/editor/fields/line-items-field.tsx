"use client";

import type { Draft } from "immer";
import { IconArrowDown, IconArrowUp, IconPlus, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharCount } from "./char-count";
import { Tooltip } from "@/components/ui/tooltip";
import { amountInWords, formatInr, lineAmount } from "@/lib/money";
import { MAX_LINE_ITEMS, type LineItem } from "../../../schema";
import { newLineItemId } from "../../../templates/quotation";
import { NumberInput } from "./number-input";

export function LineItemsField({
  items,
  update,
  readOnly,
}: {
  items: readonly LineItem[];
  update: (recipe: (items: Draft<LineItem>[]) => void) => void;
  readOnly?: boolean;
}) {
  const total = items.reduce((sum, item) => sum + lineAmount(item.qty, item.ratePaise), 0);
  const move = (from: number, to: number) =>
    update((draft) => {
      const [item] = draft.splice(from, 1);
      draft.splice(to, 0, item);
    });

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={item.id} className="border-border flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-medium tabular-nums">Item {index + 1}</span>
              {!readOnly && (
                <div className="flex items-center">
                  <Tooltip content="Move up">
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label={`Move item ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <IconArrowUp />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Move down">
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label={`Move item ${index + 1} down`}
                      disabled={index === items.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <IconArrowDown />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Remove">
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => update((draft) => void draft.splice(index, 1))}
                    >
                      <IconX />
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
            <Textarea
              aria-label={`Item ${index + 1} description`}
              placeholder="Item description"
              value={item.description}
              readOnly={readOnly}
              maxLength={300}
              rows={1}
              className="min-h-9"
              onChange={(event) => update((draft) => void (draft[index].description = event.target.value))}
            />
            {!readOnly && <CharCount value={item.description} max={300} />}
            <div className="grid grid-cols-[1fr_2fr_2fr] items-center gap-2">
              <NumberInput
                aria-label={`Item ${index + 1} quantity`}
                placeholder="Qty"
                value={item.qty}
                readOnly={readOnly}
                onValueChange={(qty) => update((draft) => void (draft[index].qty = Math.min(qty, 100_000)))}
              />
              <NumberInput
                aria-label={`Item ${index + 1} rate in rupees`}
                placeholder="Rate (₹)"
                value={item.ratePaise / 100}
                readOnly={readOnly}
                onValueChange={(rupees) =>
                  update(
                    (draft) =>
                      void (draft[index].ratePaise = Math.min(Math.round(rupees * 100), 1_000_000_000_00)),
                  )
                }
              />
              <span className="text-right text-sm tabular-nums">
                {formatInr(lineAmount(item.qty, item.ratePaise))}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {!readOnly && items.length < MAX_LINE_ITEMS && (
        <Button
          variant="tertiary"
          leadingIcon={IconPlus}
          className="self-start"
          onClick={() =>
            update((draft) => void draft.push({ id: newLineItemId(), description: "", qty: 1, ratePaise: 0 }))
          }
        >
          Add item
        </Button>
      )}
      <div className="border-border flex flex-col items-end gap-0.5 border-t pt-3">
        <span className="text-base font-semibold tabular-nums">Total {formatInr(total)}</span>
        <span className="text-muted-foreground text-xs">{amountInWords(total)}</span>
      </div>
    </div>
  );
}
