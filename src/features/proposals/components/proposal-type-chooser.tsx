"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, FilePen, Plus, ReceiptText, Repeat, type LucideIcon } from "lucide-react";
import { Banner, BannerTitle } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardEyebrow,
  CardGroup,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProposalAction } from "../actions";
import { PROPOSAL_TYPE_DETAILS, PROPOSAL_TYPES, type ProposalType } from "../domain";

const TYPE_ICONS: Record<ProposalType, LucideIcon> = {
  quotation: ReceiptText,
  project: Briefcase,
  retainer: Repeat,
  change: FilePen,
};

export function ProposalTypeChooser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState<ProposalType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(type: ProposalType) {
    if (creating) return;
    setCreating(type);
    setError(null);
    try {
      const result = await createProposalAction(type);
      if (result.ok) {
        router.push(`/proposals/${result.value.id}`);
        return;
      }
      setError(
        result.error === "unauthorized"
          ? "Your session ended. Sign in again."
          : "Could not create the offer.",
      );
    } catch {
      setError("Could not create the offer. Check your connection and try again.");
    }
    setCreating(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button leadingIcon={Plus}>New offer</Button>} />
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>New offer</DialogTitle>
          <DialogDescription>
            Each scenario gets one offer. Extra work on an accepted project is a Change Request.
          </DialogDescription>
        </DialogHeader>
        <CardGroup columns={2} separated className="max-sm:grid-cols-1">
          {PROPOSAL_TYPES.map((type) => {
            const details = PROPOSAL_TYPE_DETAILS[type];
            return (
              <Card
                key={type}
                label={`New ${details.label}`}
                onClick={() => choose(type)}
                disabled={creating !== null}
                selected={creating === type}
              >
                <CardHeader>
                  <CardMedia icon={TYPE_ICONS[type]} />
                  <CardEyebrow>
                    {details.numberPrefix}
                    {creating === type ? " · Creating…" : ""}
                  </CardEyebrow>
                  <CardTitle>{details.label}</CardTitle>
                  <CardDescription>{details.useWhen}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </CardGroup>
        {error && (
          <Banner status="warning">
            <BannerTitle>{error}</BannerTitle>
          </Banner>
        )}
      </DialogContent>
    </Dialog>
  );
}
