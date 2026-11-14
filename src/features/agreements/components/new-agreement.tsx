"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Banner, BannerTitle } from "@/components/ui/banner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatInr } from "@/lib/money";
import type { PlanTier } from "@/features/proposals/schema";
import { createAgreementAction } from "../actions";
import type { AcceptedAgreementProposal } from "../service";

export function NewAgreement({ sources }: { sources: AcceptedAgreementProposal[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [tier, setTier] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = sources.find((s) => s.id === sourceId);
  async function create() {
    if (!source || !tier || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await createAgreementAction({ proposalId: source.id, tier: tier as PlanTier });
      if (result.ok) {
        router.push(`/agreements/${result.value.id}`);
        setOpen(false);
      } else
        setError(
          result.error === "unauthorized"
            ? "Your session ended. Sign in again."
            : "Could not create the agreement. Refresh to check that the proposal is still accepted.",
        );
    } catch {
      setError("Could not create the agreement. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button leadingIcon={IconPlus}>New agreement</Button>} />
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>New service agreement</DialogTitle>
          <DialogDescription>
            Select an accepted project or retainer proposal and the option agreed with the client.
          </DialogDescription>
        </DialogHeader>
        {sources.length ? (
          <div className="flex flex-col gap-5">
            <Field>
              <FieldLabel>Accepted proposal</FieldLabel>
              <Select
                value={sourceId}
                onValueChange={(id) => {
                  setSourceId(id);
                  setTier("");
                }}
                disabled={pending}
              >
                <SelectTrigger aria-label="Accepted proposal" placeholder="Choose a proposal" />
                <SelectContent>
                  {sources.map((s, i) => (
                    <SelectItem key={s.id} value={s.id} index={i}>
                      {s.number} · {s.clientName || s.title || "Untitled"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {source && (
              <Field>
                <FieldLabel>Agreed option</FieldLabel>
                <Select value={tier} onValueChange={setTier} disabled={pending}>
                  <SelectTrigger aria-label="Agreed option" placeholder="Choose the accepted option" />
                  <SelectContent>
                    {source.options.map((o, i) => (
                      <SelectItem key={o.tier} value={o.tier} index={i}>
                        {o.label} · {formatInr(o.feePaise)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              No accepted project or retainer proposals yet. Accept a proposal before creating its agreement.
            </p>
            <Button variant="tertiary" render={<Link href="/proposals" />}>
              Go to proposals
            </Button>
          </div>
        )}
        {error && (
          <Banner status="warning">
            <BannerTitle>{error}</BannerTitle>
          </Banner>
        )}
        <DialogFooter>
          <Button variant="tertiary" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          {sources.length > 0 && (
            <Button onClick={create} loading={pending} disabled={!source || !tier}>
              Create agreement
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
