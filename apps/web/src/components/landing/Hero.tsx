import { Container } from "./Section";
import { StoreButtons } from "./StoreButtons";
import { PhoneMockup } from "./PhoneMockup";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,#DCE9E3_0%,rgba(220,233,227,0)_100%)]" />
      <Container className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-28">
        <div className="max-w-xl">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            A global Muslim community
          </p>
          <h1 className="animate-fade-up delay-100 mt-5 text-[2.75rem] font-bold leading-[1.05] tracking-tight text-brand-forest sm:text-6xl">
            New city?
            <br />
            Find your people.
          </h1>
          <p className="animate-fade-up delay-200 mt-6 text-lg leading-relaxed text-gray-700 sm:text-xl">
            Discover Muslim communities, meet like-minded people and join activities wherever you are.
          </p>
          <StoreButtons className="animate-fade-up delay-300 mt-9" />
          <p className="animate-fade-up delay-300 mt-5 text-sm text-gray-500">
            Free · Privacy-first · Not a dating app
          </p>
        </div>
        <div className="animate-fade-up delay-200">
          <PhoneMockup />
        </div>
      </Container>
    </section>
  );
}
