import { Section, SectionHeading } from "./Section";
import { COMMUNITY_CARDS } from "@/lib/landing-data";

export function Community() {
  return (
    <Section id="community">
      <SectionHeading
        eyebrow="Community"
        title="More than a profile. Find your community."
        subtitle="Communities are the heart of WMC. Join the ones that match your interests, or start your own."
      />
      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {COMMUNITY_CARDS.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-16px_rgba(11,61,53,0.25)] sm:p-6"
          >
            <span className="text-3xl" aria-hidden="true">
              {c.emoji}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-brand-forest">{c.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{c.blurb}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
