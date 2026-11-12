import { Badge, type BadgeColor } from "@/components/ui/badge";
import { PROPOSAL_STATUS_LABELS, type ProposalStatus } from "../domain";

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, BadgeColor> = {
  draft: "gray",
  sent: "blue",
  accepted: "green",
  replaced: "amber",
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge variant="dot" color={PROPOSAL_STATUS_COLORS[status]}>
      {PROPOSAL_STATUS_LABELS[status]}
    </Badge>
  );
}
