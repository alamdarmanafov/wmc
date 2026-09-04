import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { brand } from "@wmc/shared";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wmc.app";
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
