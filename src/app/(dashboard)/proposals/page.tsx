import { Suspense } from "react";
import { ProposalsList } from "@/features/proposals/components/proposals-list";
import { listProposals } from "@/features/proposals/service";

async function ProposalsLoader() {
  const proposals = await listProposals();
  return <ProposalsList proposals={proposals} />;
}

export default function ProposalsPage() {
  return (
    // The dashboard layout's boundary doesn't cover client navigations into this
    // page, so the uncached list query needs its own.
    <Suspense
      fallback={
        <p role="status" className="text-muted-foreground p-6 text-sm">
          Loading offers…
        </p>
      }
    >
      <ProposalsLoader />
    </Suspense>
  );
}
