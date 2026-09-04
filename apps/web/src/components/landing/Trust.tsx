import { Handshake, Lock, ShieldCheck } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Section, SectionHeading } from "./Section";
import { TRUST_CARDS } from "@/lib/landing-data";

const ICONS: Record<(typeof TRUST_CARDS)[number]["icon"], ComponentType<SVGProps<SVGSVGElement>>> = {
  lock: Lock,
  shield: ShieldCheck,
  handshake: Handshake,
};

export function Trust() {
  return (
    <Section id="trust" tone="forest">
      <SectionHeading eyebrow="Trust & safety" title="Built for community. Designed for connection." invert />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {TRUST_CARDS.map((c) => {
          const Icon = ICONS[c.icon];
          return (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-white">{c.title}</h3>
              <p className="mt-2 leading-relaxed text-white/75">{c.text}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
