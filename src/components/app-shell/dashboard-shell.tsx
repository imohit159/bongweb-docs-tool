"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconContract, IconFileText, IconReceiptRupee, type Icon as TablerIcon } from "@tabler/icons-react";
import type { IconComponentProps } from "@/lib/icon-context";
import { MotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// The proposal editor needs the width: the sidebar closes whenever an offer
// opens, and the user's saved choice comes back on other pages. The editor's
// open/closed state is separate and never written to the cookie.
const EDITOR_ROUTE = /^\/proposals\/[0-9a-f-]{36}$/i;

// The menu thickens a lit row's icon stroke; these keep one light outline in
// every state, so the pill background alone marks the active and hovered row.
function outline(Icon: TablerIcon) {
  function OutlineIcon({ size, className }: IconComponentProps) {
    return <Icon size={size} className={className} stroke={1.5} />;
  }
  OutlineIcon.displayName = `Outline${Icon.displayName ?? ""}`;
  return OutlineIcon;
}

const navigation = [
  { href: "/proposals", label: "Proposals", icon: outline(IconFileText) },
  { href: "/agreements", label: "Agreements", icon: outline(IconContract) },
  { href: "/invoices", label: "Invoices", icon: outline(IconReceiptRupee) },
];

export function DashboardShell({
  children,
  user,
  defaultOpen,
}: {
  children: ReactNode;
  user: { name: string; email: string };
  defaultOpen: boolean;
}) {
  const pathname = usePathname();
  const isEditor = EDITOR_ROUTE.test(pathname);
  const [pinnedOpen, setPinnedOpen] = useState(defaultOpen);
  const [editorOpen, setEditorOpen] = useState(false);
  // Opening an offer always closes the sidebar, even if it was opened in the
  // previous one; the trigger still opens it for the current offer.
  const [editorPath, setEditorPath] = useState<string | null>(isEditor ? pathname : null);
  if (isEditor && editorPath !== pathname) {
    setEditorPath(pathname);
    setEditorOpen(false);
  } else if (!isEditor && editorPath !== null) {
    setEditorPath(null);
  }
  const title =
    navigation.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label ??
    "Workspace";
  return (
    <MotionConfig reducedMotion="user">
      <SidebarProvider
        open={isEditor ? editorOpen : pinnedOpen}
        onOpenChange={isEditor ? setEditorOpen : setPinnedOpen}
        persist={!isEditor}
        peek="hover"
        className={isEditor ? "h-svh" : undefined}
      >
        <Sidebar variant="inset" bordered={false}>
          <SidebarHeader>
            <Link
              href="/proposals"
              aria-label="Bongweb workspace"
              className="flex min-h-14 items-center px-3"
            >
              <Image
                src="/brand/wordmark-light.svg"
                alt="Bongweb"
                width={139}
                height={40}
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/brand/wordmark-dark.svg"
                alt="Bongweb"
                width={139}
                height={40}
                className="hidden h-8 w-auto dark:block"
              />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Documents</SidebarGroupLabel>
              {/* A small gap keeps the active and hover highlights as separate pills, and the
                  active one is a clearly stronger tint than hover (scoped to this menu). */}
              <SidebarMenu className="gap-0.5 [--active:color-mix(in_oklab,var(--foreground)_13%,transparent)] [--hover:color-mix(in_oklab,var(--foreground)_5%,transparent)]">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      icon={item.icon}
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      render={<Link href={item.href} />}
                      aria-current={pathname === item.href ? "page" : undefined}
                    >
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-col gap-3 px-2 py-2">
              <div className="min-w-0" title={user.email}>
                <p className="truncate text-sm font-medium">{user.name || user.email}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
              <SignOutButton />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset style={{ border: "none", outline: "none", boxShadow: "none" }}>
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-5">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-medium">{title}</span>
            </div>
            <ThemeToggle />
          </header>
          <div className={isEditor ? "flex min-h-0 flex-1 flex-col" : "flex flex-1 flex-col p-6 sm:p-8"}>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MotionConfig>
  );
}
