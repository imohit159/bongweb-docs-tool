import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProposalEditor } from "@/features/proposals/components/editor/proposal-editor";
import { formatProposalNumber } from "@/features/proposals/domain";
import { getProposal, listAcceptedProjects } from "@/features/proposals/service";
import { getStudioDetails } from "@/features/studio/service";

async function EditorLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [proposal, studio] = await Promise.all([getProposal(id), getStudioDetails()]);
  if (!proposal) notFound();
  // Only a Change Request needs the accepted projects it can amend.
  const acceptedProjects = proposal.type === "change" ? await listAcceptedProjects() : [];
  return (
    <ProposalEditor
      // A fresh editor (and store) per offer and version.
      key={`${proposal.id}:${proposal.rowVersion}`}
      proposal={{
        id: proposal.id,
        type: proposal.type,
        status: proposal.status,
        number: formatProposalNumber(proposal.type, proposal.sequence, proposal.version),
      }}
      rowVersion={proposal.rowVersion}
      content={proposal.content}
      studio={studio}
      lookups={{ acceptedProjects }}
    />
  );
}

export default function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-muted-foreground p-6 text-sm">
          Opening offer…
        </p>
      }
    >
      <EditorLoader params={params} />
    </Suspense>
  );
}
