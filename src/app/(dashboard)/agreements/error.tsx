"use client";
import { Banner, BannerActions, BannerAction, BannerTitle } from "@/components/ui/banner";
export default function AgreementsError({ retry }: { retry: () => void }) {
  return (
    <Banner status="warning">
      <BannerTitle>Agreements could not be loaded</BannerTitle>
      <BannerActions>
        <BannerAction variant="primary" onClick={retry}>
          Try again
        </BannerAction>
      </BannerActions>
    </Banner>
  );
}
