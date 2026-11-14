import { Suspense } from "react";
import { AgreementsList } from "@/features/agreements/components/agreements-list";
import { listAgreements, listAgreementSources } from "@/features/agreements/service";
async function AgreementsLoader() {
  const [agreements, sources] = await Promise.all([listAgreements(), listAgreementSources()]);
  return <AgreementsList agreements={agreements} sources={sources} />;
}
export default function AgreementsPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-muted-foreground p-6 text-sm">
          Loading agreements…
        </p>
      }
    >
      <AgreementsLoader />
    </Suspense>
  );
}
