import { Calendar, MapPin, Sparkles, Users, UsersRound } from "lucide-react";
import { greeting } from "@wmc/shared";

const tiles = [
  { label: "Meet People", Icon: Users },
  { label: "Communities", Icon: UsersRound },
  { label: "Events", Icon: Calendar },
  { label: "Join me", Icon: Sparkles },
] as const;

/** Pure CSS/HTML phone frame showing a mini Home screen. Decorative only. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]" aria-hidden="true">
      <div className="absolute -inset-10 -z-10 rounded-full bg-brand-soft/60 blur-3xl" />
      <div className="rounded-[2.6rem] border-[6px] border-ink bg-ink p-[3px] shadow-[0_30px_80px_-20px_rgba(11,61,53,0.45)]">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-cream">
          {/* notch */}
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />

          <div className="px-5 pb-6 pt-12">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold text-brand-forest">{greeting("Ahmed")}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
                  <MapPin className="h-3 w-3 text-brand" />
                  Berlin
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand to-brand-green ring-2 ring-white" />
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              What do you want to do?
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {tiles.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-2xl bg-white p-3 ring-1 ring-gray-200"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mint text-brand">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[12px] font-semibold text-gray-900">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">This weekend</p>
            <div className="mt-2 rounded-2xl bg-white p-3.5 ring-1 ring-gray-200">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-lg">
                  ⚽
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-900">Muslim Football Meetup</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Sat 18:00 · Tempelhofer Feld</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-5 w-5 rounded-full bg-brand-soft ring-2 ring-white" />
                  <span className="-ml-1.5 h-5 w-5 rounded-full bg-brand-green ring-2 ring-white" />
                  <span className="-ml-1.5 h-5 w-5 rounded-full bg-gold ring-2 ring-white" />
                  <span className="ml-2 text-[11px] font-medium text-gray-700">18 going</span>
                </div>
                <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">Join</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-brand-mint p-3 ring-1 ring-brand-soft">
              <p className="text-[11px] font-medium text-brand-forest">
                <span className="mr-1">☕</span>Yusuf: “Anyone up for coffee tonight?”
              </p>
              <p className="mt-1 text-[10px] text-gray-500">3 people are in · Kreuzberg</p>
            </div>
          </div>

          <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
}
