import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Container } from "./Section";

interface LegalPageProps {
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ title, intro, updated, children }: LegalPageProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 py-16 sm:py-24">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Last updated {updated}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-forest">{title}</h1>
          <p className="mt-4 text-lg text-gray-700">{intro}</p>
          <div className="prose-wmc mt-10 space-y-8 text-gray-900">{children}</div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-brand-forest">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}
