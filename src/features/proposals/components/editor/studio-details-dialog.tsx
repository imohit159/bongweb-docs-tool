"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { Banner, BannerTitle } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveStudioDetailsAction } from "@/features/studio/actions";
import { STUDIO_NAME, type StudioDetails } from "@/features/studio/schema";
import { useEditor } from "./editor-store";
import { TextField } from "./fields/text-field";

const GROUPS: {
  legend: string;
  fields: { key: keyof StudioDetails; label: string; type?: "email" | "tel" }[];
}[] = [
  {
    legend: "Contact",
    fields: [
      { key: "address", label: "Address, City, State" },
      { key: "phone", label: "Phone / WhatsApp", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "website", label: "Website" },
    ],
  },
  {
    legend: "How to pay",
    fields: [
      { key: "upiId", label: "UPI ID" },
      { key: "accountName", label: "Account name" },
      { key: "accountNumber", label: "Account number" },
      { key: "ifsc", label: "IFSC" },
      { key: "bankName", label: "Bank name" },
    ],
  },
  {
    legend: "Signatory",
    fields: [
      { key: "signatoryName", label: "Name" },
      { key: "signatoryRole", label: "Role" },
    ],
  },
];

export function StudioDetailsDialog() {
  const studio = useEditor((s) => s.studio);
  const setStudio = useEditor((s) => s.setStudio);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(studio);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    try {
      const result = await saveStudioDetailsAction(draft);
      if (result.ok) {
        setStudio(result.value);
        setOpen(false);
      } else {
        setError(
          result.error === "invalid" ? "Check the email address." : "Your session ended. Sign in again.",
        );
      }
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(studio);
          setError(null);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="compact" leadingIcon={Building2}>
            Studio details
          </Button>
        }
      />
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Studio details</DialogTitle>
          <DialogDescription>
            Printed on every document from {STUDIO_NAME}. Changes apply to all offers, including ones already
            created.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60dvh]">
          <div className="flex flex-col gap-6 pr-3">
            {GROUPS.map((group) => (
              <FieldSet key={group.legend}>
                <FieldLegend>{group.legend}</FieldLegend>
                <FieldGroup>
                  {group.fields.map((field) => (
                    <TextField
                      key={field.key}
                      label={field.label}
                      type={field.type}
                      value={draft[field.key]}
                      onChange={(value) => setDraft((d) => ({ ...d, [field.key]: value }))}
                    />
                  ))}
                </FieldGroup>
              </FieldSet>
            ))}
          </div>
        </ScrollArea>
        {error && (
          <Banner status="warning">
            <BannerTitle>{error}</BannerTitle>
          </Banner>
        )}
        <DialogFooter>
          <Button variant="tertiary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={pending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
