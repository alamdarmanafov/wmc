import { Calendar, Sparkles, Users, UsersRound } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Section, SectionHeading } from "./Section";
import { FEATURES } from "@/lib/landing-data";

const ICONS: Record<(typeof FEATURES)[number]["icon"], ComponentType<SVGProps<SVGSVGElement>>> = {
  users: Users,
  communities: UsersRound,
  calendar: Calendar,
  sparkles: Sparkles,
};

export function Features() {
  return (
    <Section id="features" tone="white">
      <SectionHeading eyebrow="Features" title="Everything you need to feel at home." />
      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = ICONS[f.icon];
          return (
            <div
              key={f.title}
              className="group rounded-2xl border border-gray-200 bg-cream p-7 transition hover:border-brand-soft hover:bg-brand-mint"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-gray-200 transition group-hover:ring-brand-soft">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-brand-forest">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-700">{f.text}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
