import { cookies } from "next/headers";
import { DashboardShell } from "@/components/app-shell/dashboard-shell";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/features/auth/service";

async function AuthenticatedDashboard({ children }: { children: ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  return (
    <DashboardShell user={user} defaultOpen={defaultOpen}>
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6">
          Loading workspace…
        </p>
      }
    >
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}
