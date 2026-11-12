"use client";

import {
  IconArrowBackUp,
  IconArrowLeft,
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconFilePencil,
  IconSend,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { changeProposalStatusAction, reviseProposalAction } from "../../actions";
import { PROPOSAL_TYPE_DETAILS, canChangeStatus, canRevise, type ProposalStatus } from "../../domain";
import { ProposalStatusBadge } from "../proposal-status-badge";
import { useEditor, type SaveState } from "./editor-store";
import { StudioDetailsDialog } from "./studio-details-dialog";

const SAVE_LABELS: Record<SaveState, string> = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Couldn't save",
  conflict: "Changed elsewhere",
  locked: "Read-only",
};

function SaveIndicator() {
  const saveState = useEditor((s) => s.saveState);
  const status = useEditor((s) => s.proposal.status);
  const retry = useEditor((s) => s.retrySave);
  if (status !== "draft") return null;
  return (
    <span className="text-muted-foreground flex items-center gap-1 text-xs" role="status" aria-live="polite">
      {SAVE_LABELS[saveState]}
      {saveState === "error" && (
        <Button variant="ghost" size="compact" onClick={retry}>
          Retry
        </Button>
      )}
    </span>
  );
}

function StatusMenu({ onError }: { onError: (message: string) => void }) {
  const router = useRouter();
  const proposal = useEditor((s) => s.proposal);
  const saveState = useEditor((s) => s.saveState);
  const setStatus = useEditor((s) => s.setStatus);
  const [pending, setPending] = useState(false);

  async function change(to: ProposalStatus) {
    setPending(true);
    try {
      const result = await changeProposalStatusAction({ id: proposal.id, to });
      if (result.ok) {
        setStatus(result.value.status, result.value.rowVersion);
        router.refresh();
      } else onError("The status changed elsewhere. Reload to see the latest version.");
    } catch {
      onError("Could not change the status. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function revise() {
    setPending(true);
    try {
      const result = await reviseProposalAction(proposal.id);
      if (result.ok) router.push(`/proposals/${result.value.id}`);
      else onError("This offer was already revised or changed. Reload to see the latest version.");
    } catch {
      onError("Could not create the revision. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  // Marking a draft as sent waits for pending edits, so the record matches what was sent.
  const unsaved = saveState === "dirty" || saveState === "saving";
  const items = [
    canChangeStatus(proposal.status, "sent") && {
      icon: IconSend,
      label: "Mark as sent",
      run: () => change("sent"),
      disabled: unsaved,
    },
    canChangeStatus(proposal.status, "accepted") && {
      icon: IconCheck,
      label: "Mark as accepted",
      run: () => change("accepted"),
    },
    canChangeStatus(proposal.status, "draft") && {
      icon: IconArrowBackUp,
      label: "Back to draft",
      run: () => change("draft"),
    },
    canRevise(proposal.status) && { icon: IconFilePencil, label: "Revise (new version)", run: revise },
  ].filter(Boolean) as { icon: typeof IconSend; label: string; run: () => void; disabled?: boolean }[];

  if (items.length === 0) return <ProposalStatusBadge status={proposal.status} />;
  return (
    <DropdownMenu>
      <DropdownTrigger
        render={
          <Button
            variant="ghost"
            size="compact"
            trailingIcon={IconChevronDown}
            loading={pending}
            aria-label="Change status"
          >
            <ProposalStatusBadge status={proposal.status} />
          </Button>
        }
      />
      <DropdownContent align="start" className="w-56">
        {items.map((item, index) => (
          <MenuItem
            key={item.label}
            index={index}
            icon={item.icon}
            label={item.label}
            disabled={item.disabled}
            onSelect={item.run}
          />
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

export function EditorTopBar({
  onDownload,
  onError,
}: {
  onDownload: () => void;
  onError: (message: string) => void;
}) {
  const proposal = useEditor((s) => s.proposal);
  return (
    <header className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2">
      <Button
        variant="ghost"
        size="icon-compact"
        aria-label="Back to proposals"
        render={<Link href="/proposals" />}
      >
        <IconArrowLeft />
      </Button>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground truncate text-xs">
          {PROPOSAL_TYPE_DETAILS[proposal.type].label}
        </span>
        <span className="text-sm font-semibold tabular-nums">{proposal.number}</span>
      </div>
      <StatusMenu onError={onError} />
      <div className="ml-auto flex items-center gap-2">
        <SaveIndicator />
        <StudioDetailsDialog />
        <Button size="compact" leadingIcon={IconDownload} onClick={onDownload}>
          Download
        </Button>
      </div>
    </header>
  );
}
