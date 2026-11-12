import { ProposalsList } from "@/features/proposals/components/proposals-list";
import { listProposals } from "@/features/proposals/service";

export default async function ProposalsPage() {
  const proposals = await listProposals();
  return <ProposalsList proposals={proposals} />;
}
