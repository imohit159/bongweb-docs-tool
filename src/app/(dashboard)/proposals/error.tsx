"use client";

import { IconRefresh } from "@tabler/icons-react";
import { useEffect } from "react";
import { Banner, BannerAction, BannerActions, BannerDescription, BannerTitle } from "@/components/ui/banner";

// Shown when the offers list fails to load or render. Details stay in the console and dev log.
export default function ProposalsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Proposals failed to load", error);
  }, [error]);

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Proposals</h1>
      <Banner status="warning">
        <BannerTitle>Offers could not be loaded</BannerTitle>
        <BannerDescription>
          Something went wrong while loading or showing your offers. Try again; if it keeps happening, the
          details are in the browser console.
        </BannerDescription>
        <BannerActions>
          <BannerAction variant="primary" leadingIcon={IconRefresh} onClick={() => retry()}>
            Try again
          </BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}
