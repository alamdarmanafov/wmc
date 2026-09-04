import { MapPin } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import { CITIES } from "@/lib/landing-data";

const REQUEST_MAILTO =
  "mailto:hello@wmc.app?subject=Request%20my%20city&body=Hi%20WMC%2C%20please%20launch%20in%3A%20";

export function Cities() {
  return (
    <Section id="cities">
      <SectionHeading eyebrow="Cities" title="Launching city by city." subtitle="We open new cities as soon as a community forms there." />
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {CITIES.map((c, i) => (
          <span
            key={c.slug}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
              i === 0
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-white text-gray-900"
            }`}
          >
            <MapPin className={`h-3.5 w-3.5 ${i === 0 ? "text-white/80" : "text-brand"}`} aria-hidden="true" />
            {c.name}
            {i === 0 && <span className="text-[10px] font-semibold uppercase tracking-wider text-white/75">Live first</span>}
          </span>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500">
        Don&apos;t see your city?{" "}
        <a href={REQUEST_MAILTO} className="font-semibold text-brand underline-offset-4 hover:underline">
          Request your city
        </a>
      </p>
    </Section>
  );
}
