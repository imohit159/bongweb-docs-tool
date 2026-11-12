"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/** Move up / move down / remove for one row of a repeatable list. */
export function RowControls({
  index,
  count,
  noun,
  onMove,
  onRemove,
  minCount = 0,
}: {
  index: number;
  count: number;
  noun: string;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  minCount?: number;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <Tooltip content="Move up">
        <Button
          variant="ghost"
          size="icon-compact"
          aria-label={`Move ${noun} ${index + 1} up`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp />
        </Button>
      </Tooltip>
      <Tooltip content="Move down">
        <Button
          variant="ghost"
          size="icon-compact"
          aria-label={`Move ${noun} ${index + 1} down`}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown />
        </Button>
      </Tooltip>
      <Tooltip content="Remove">
        <Button
          variant="ghost"
          size="icon-compact"
          aria-label={`Remove ${noun} ${index + 1}`}
          disabled={count <= minCount}
          onClick={() => onRemove(index)}
        >
          <X />
        </Button>
      </Tooltip>
    </div>
  );
}

export function moveItem<T>(list: T[], from: number, to: number) {
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}
