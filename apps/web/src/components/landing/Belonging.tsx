import { Section } from "./Section";

export function Belonging() {
  return (
    <Section id="about" tone="white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-5xl">
          You don&apos;t have to feel alone.
        </h2>
        <div className="mt-10 flex flex-col items-center gap-2 text-2xl font-medium text-gray-500 sm:flex-row sm:justify-center sm:gap-6 sm:text-3xl">
          <span>New city.</span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-brand-soft sm:block" />
          <span>New country.</span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-brand-soft sm:block" />
          <span className="text-brand-forest">New life.</span>
        </div>
        <p className="mt-10 text-xl leading-relaxed text-gray-700 sm:text-2xl">
          But finding your community shouldn&apos;t be hard.
        </p>
      </div>
    </Section>
  );
}
