import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSupabaseEnv } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "WMC Admin", template: "%s · WMC Admin" },
  description: "Moderation and analytics for World Muslim Community.",
  robots: { index: false, follow: false },
};

/**
 * Hands the two public Supabase values to the browser when they were provided
 * without the NEXT_PUBLIC_ prefix (see lib/env.ts). Both values are safe to expose.
 */
function PublicEnvScript() {
  const env = getSupabaseEnv();
  if (!env) return null;
  const json = JSON.stringify({ url: env.url, anonKey: env.anonKey }).replace(/</g, "\\u003c");
  return <script id="wmc-env" dangerouslySetInnerHTML={{ __html: `window.__WMC_ENV__=${json};` }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <PublicEnvScript />
      </head>
      <body className="flex min-h-full flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
