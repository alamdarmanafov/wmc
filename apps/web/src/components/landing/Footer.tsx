import Link from "next/link";
import { brand } from "@wmc/shared";
import { Logo } from "@/components/Logo";
import { Container } from "./Section";
import { FOOTER_LINKS } from "@/lib/landing-data";
import { InstagramIcon, LinkedInIcon, XIcon, YouTubeIcon } from "./SocialIcons";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/", Icon: InstagramIcon },
  { label: "X", href: "https://x.com/", Icon: XIcon },
  { label: "LinkedIn", href: "https://linkedin.com/", Icon: LinkedInIcon },
  { label: "YouTube", href: "https://youtube.com/", Icon: YouTubeIcon },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-cream">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-gray-700">{brand.tagline}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
              {FOOTER_LINKS.map((l) =>
                l.href.startsWith("#") ? (
                  <li key={l.href}>
                    <a href={`/${l.href}`} className="text-gray-700 transition hover:text-brand-forest">
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link href={l.href} className="text-gray-700 transition hover:text-brand-forest">
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-brand-soft hover:text-brand-forest"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {brand.name}. All rights reserved.</p>
          <p>{brand.taglineEmotional}</p>
        </div>
      </Container>
    </footer>
  );
}
