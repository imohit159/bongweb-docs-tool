import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AgreementEditor } from "@/features/agreements/components/agreement-editor";
import { getAgreement } from "@/features/agreements/service";
async function AgreementLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) notFound();
  return <AgreementEditor key={`${agreement.id}:${agreement.rowVersion}`} agreement={agreement} />;
}
export default function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-muted-foreground p-6 text-sm">
          Opening agreement…
        </p>
      }
    >
      <AgreementLoader params={params} />
    </Suspense>
  );
}
