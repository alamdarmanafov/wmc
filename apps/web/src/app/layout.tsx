import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { brand } from "@wmc/shared";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Public site origin for metadata. Tolerates an empty value, a missing scheme
 * ("wmc.vercel.app") or a path, and falls back to Vercel's URL, then to the brand domain.
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "https://wmc.app",
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // try the next candidate
    }
  }
  return "https://wmc.app";
}

const siteUrl = resolveSiteUrl();
const title = `${brand.name} — ${brand.fullName}`;
const description = `${brand.tagline} ${brand.positioning}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${brand.name}`,
  },
  description,
  applicationName: brand.name,
  keywords: ["Muslim community", "meet Muslims", "Muslim events", "new city", "community app"],
  openGraph: {
    type: "website",
    siteName: brand.fullName,
    title,
    description,
    url: siteUrl,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${brand.name} — ${brand.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
