import { ChevronDown } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import { FAQ } from "@/lib/landing-data";

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />
      <div className="mx-auto mt-12 max-w-3xl divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
        {FAQ.map((item, i) => (
          <details key={item.q} className="group px-6" open={i === 0}>
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-left text-base font-semibold text-brand-forest sm:text-lg">
              {item.q}
              <ChevronDown className="faq-chevron h-5 w-5 shrink-0 text-gray-500 transition-transform" aria-hidden="true" />
            </summary>
            <p className="pb-6 leading-relaxed text-gray-700">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
