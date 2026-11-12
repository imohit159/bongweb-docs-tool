"use client";

import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { useEffect } from "react";
import { Banner, BannerAction, BannerActions, BannerDescription, BannerTitle } from "@/components/ui/banner";

// The editor's own boundary, so an editor crash is not reported as the list failing.
export default function ProposalEditorError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Proposal editor crashed", error);
  }, [error]);

  return (
    <div className="flex max-w-xl flex-col gap-4 p-6">
      <Banner status="warning">
        <BannerTitle>The editor stopped working</BannerTitle>
        <BannerDescription>
          Everything up to the last &ldquo;Saved&rdquo; is kept. Try again, or go back to the list. The
          details are in the browser console.
        </BannerDescription>
        <BannerActions>
          <BannerAction variant="primary" leadingIcon={IconRefresh} onClick={() => retry()}>
            Try again
          </BannerAction>
          <BannerAction variant="secondary" leadingIcon={IconArrowLeft} href="/proposals">
            Back to proposals
          </BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}
