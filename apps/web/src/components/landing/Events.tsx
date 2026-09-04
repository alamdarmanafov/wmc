import { Calendar, MapPin, Users } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import { SAMPLE_EVENTS } from "@/lib/landing-data";

export function Events() {
  return (
    <Section id="events" tone="white">
      <SectionHeading eyebrow="Events" title="Something is always happening." />
      <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_EVENTS.map((e) => (
          <li
            key={e.title}
            className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-cream p-5 transition hover:border-brand-soft"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-2xl" aria-hidden="true">
              {e.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-brand-forest">{e.title}</h3>
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">When</dt>
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <dd>{e.when}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">City</dt>
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <dd>{e.city}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Going</dt>
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <dd>{e.going} going</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
        <li className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-500">
          Sample events — real ones appear in the app for your city.
        </li>
      </ul>
    </Section>
  );
}
