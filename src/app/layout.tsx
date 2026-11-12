import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/ui/theme-provider";

import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: "Bongweb Docs Tool",
  description: "Internal proposals, agreements, and invoices for Bongweb.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
