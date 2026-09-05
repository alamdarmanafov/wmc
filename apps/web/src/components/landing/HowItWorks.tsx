import { Section, SectionHeading } from "./Section";
import { HOW_IT_WORKS } from "@/lib/landing-data";

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading eyebrow="How it works" title="Three steps to your community." />
      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map((s) => (
          <li key={s.step} className="rounded-2xl border border-gray-200 bg-white p-7 transition hover:shadow-[0_12px_40px_-16px_rgba(11,61,53,0.25)]">
            <span className="text-sm font-semibold tracking-widest text-brand">{s.step}</span>
            <h3 className="mt-4 text-xl font-semibold text-brand-forest">{s.title}</h3>
            <p className="mt-2 text-gray-700">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
