import { Container } from "./Section";
import { StoreButtons } from "./StoreButtons";
import { WaitlistForm } from "./WaitlistForm";

export function FinalCta() {
  return (
    <section id="download" className="bg-cream py-20 sm:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-forest/60 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Your people are closer than you think.
            </h2>
            <p className="mt-4 text-lg text-white/75">Download the app, or join the waitlist and be first in your city.</p>
            <StoreButtons className="mt-8 justify-center" />
            <div className="mt-10 border-t border-white/15 pt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
