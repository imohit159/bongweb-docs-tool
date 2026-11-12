import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="bg-muted/30 relative hidden flex-col justify-between gap-12 border-r p-10 lg:flex xl:p-14">
        <Link href="/" aria-label="Bongweb home" className="w-fit">
          <Image
            src="/brand/wordmark-light.svg"
            alt="Bongweb"
            width={167}
            height={48}
            priority
            className="h-10 w-auto dark:hidden"
          />
          <Image
            src="/brand/wordmark-dark.svg"
            alt="Bongweb"
            width={167}
            height={48}
            priority
            className="hidden h-10 w-auto dark:block"
          />
        </Link>
        <div className="flex max-w-lg flex-col gap-7 py-12">
          <div aria-hidden="true" className="bg-primary h-1 w-12 rounded-full" />
          <p className="text-muted-foreground text-xs tracking-widest">THE STUDIO WORKSPACE</p>
          <h2 className="text-4xl leading-tight font-medium tracking-tight xl:text-5xl">
            From the first proposal to the final invoice.
          </h2>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            A little less paperwork.
            <br />A little more room for good work.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">Bongweb / Docs</p>
      </aside>
      <div className="flex min-w-0 flex-col gap-8 p-6 md:p-10 xl:p-14">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Bongweb home" className="lg:invisible">
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
          <ThemeToggle />
        </header>
        <section className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-sm flex-col gap-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
