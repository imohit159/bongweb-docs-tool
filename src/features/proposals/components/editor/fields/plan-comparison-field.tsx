"use client";

import type { Draft } from "immer";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatInr } from "@/lib/money";
import {
  PLAN_TIERS,
  PLAN_TIER_LABELS,
  newRowId,
  visibleTiers,
  type PlanComparison,
  type PlanTier,
} from "../../../schema";
import { Textarea } from "@/components/ui/textarea";
import { CharCount } from "./char-count";
import { NumberInput } from "./number-input";

/** What fits a plan-table cell in the PDF without crowding its column. */
const PLAN_CELL_MAX = 80;
import { RowControls, moveItem } from "./row-controls";

/** Premium → Standard → Basic comparison, or one fixed price (only Standard is printed). */
export function PlanComparisonField({
  plans,
  update,
  priceLabel,
  readOnly,
}: {
  plans: PlanComparison;
  update: (recipe: (draft: Draft<PlanComparison>) => void) => void;
  priceLabel: string;
  readOnly?: boolean;
}) {
  const tiers = visibleTiers(plans);
  const single = plans.mode === "single";
  const columns = { gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Pricing</FieldLabel>
          <Select
            value={plans.mode}
            disabled={readOnly}
            onValueChange={(mode) => update((draft) => void (draft.mode = mode as PlanComparison["mode"]))}
          >
            <SelectTrigger aria-label="Pricing" />
            <SelectContent>
              <SelectItem index={0} value="plans">
                Three plans
              </SelectItem>
              <SelectItem index={1} value="single">
                Single fixed price
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {!single && (
          <Field>
            <FieldLabel>Recommended</FieldLabel>
            <Select
              value={plans.recommended}
              disabled={readOnly}
              onValueChange={(tier) => update((draft) => void (draft.recommended = tier as PlanTier))}
            >
              <SelectTrigger aria-label="Recommended plan" />
              <SelectContent>
                {PLAN_TIERS.map((tier, index) => (
                  <SelectItem key={tier} index={index} value={tier}>
                    {PLAN_TIER_LABELS[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      <div className="grid gap-2 text-xs font-medium" style={columns}>
        {tiers.map((tier) => (
          <span key={tier} className="text-muted-foreground">
            {single ? "Value" : PLAN_TIER_LABELS[tier]}
            {!single && tier === plans.recommended ? " ★" : ""}
          </span>
        ))}
      </div>

      <ol className="flex flex-col gap-3">
        {plans.rows.map((row, index) => (
          <li key={row.id} className="border-border flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-1">
              <Input
                aria-label={`Row ${index + 1} label`}
                placeholder="Row label"
                value={row.label}
                readOnly={readOnly}
                maxLength={40}
                className="font-medium"
                onChange={(event) => update((draft) => void (draft.rows[index].label = event.target.value))}
              />
              {!readOnly && (
                <RowControls
                  index={index}
                  count={plans.rows.length}
                  noun="row"
                  onMove={(from, to) => update((draft) => moveItem(draft.rows, from, to))}
                  onRemove={(i) => update((draft) => void draft.rows.splice(i, 1))}
                />
              )}
            </div>
            <div className="grid gap-2" style={columns}>
              {tiers.map((tier) => (
                <div key={tier} className="flex min-w-0 flex-col gap-1">
                  <Textarea
                    aria-label={`${row.label || `Row ${index + 1}`}, ${PLAN_TIER_LABELS[tier]}`}
                    placeholder="—"
                    value={row.values[tier]}
                    readOnly={readOnly}
                    maxLength={PLAN_CELL_MAX}
                    rows={1}
                    className="min-h-9"
                    onChange={(event) =>
                      update((draft) => void (draft.rows[index].values[tier] = event.target.value))
                    }
                  />
                  {!readOnly && <CharCount value={row.values[tier]} max={PLAN_CELL_MAX} />}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {!readOnly && plans.rows.length < 15 && (
        <Button
          variant="ghost"
          size="compact"
          leadingIcon={IconPlus}
          className="self-start"
          onClick={() =>
            update(
              (draft) =>
                void draft.rows.push({
                  id: newRowId(),
                  label: "",
                  values: { premium: "", standard: "", basic: "" },
                }),
            )
          }
        >
          Add row
        </Button>
      )}

      <Field>
        <FieldLabel>
          {priceLabel} (₹)
          <span aria-hidden className="text-muted-foreground">
            {" "}
            *
          </span>
        </FieldLabel>
        <div className="grid gap-2" style={columns}>
          {tiers.map((tier) => (
            <div key={tier} className="flex flex-col gap-1">
              <NumberInput
                aria-label={`${single ? "" : `${PLAN_TIER_LABELS[tier]} `}${priceLabel} in rupees`}
                placeholder="0"
                value={plans.pricePaise[tier] / 100}
                readOnly={readOnly}
                onValueChange={(rupees) =>
                  update(
                    (draft) =>
                      void (draft.pricePaise[tier] = Math.min(Math.round(rupees * 100), 1_000_000_000_00)),
                  )
                }
              />
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatInr(plans.pricePaise[tier])}
              </span>
            </div>
          ))}
        </div>
      </Field>
    </div>
  );
}
