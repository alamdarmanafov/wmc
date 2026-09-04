import { Quote } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import { TESTIMONIALS } from "@/lib/landing-data";

export function Testimonials() {
  return (
    <Section id="stories" tone="white">
      <SectionHeading eyebrow="Stories" title="Real stories. Real connections." />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="flex flex-col rounded-2xl border border-gray-200 bg-cream p-7">
            <Quote className="h-6 w-6 text-brand-soft" aria-hidden="true" />
            <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-gray-900">“{t.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-forest">
                {t.name[0]}
              </span>
              <span>
                <span className="block text-sm font-semibold text-brand-forest">{t.name}</span>
                <span className="block text-xs text-gray-500">{t.meta}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-gray-500">
        Illustrative stories from early community conversations. Names changed.
      </p>
    </Section>
  );
}
