import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "cream" | "white" | "mint" | "forest";
}

const tones: Record<NonNullable<SectionProps["tone"]>, string> = {
  cream: "bg-cream",
  white: "bg-white",
  mint: "bg-brand-mint",
  forest: "bg-brand-forest text-white",
};

export function Section({ id, children, className = "", tone = "cream" }: SectionProps) {
  return (
    <section id={id} className={`${tones[tone]} py-20 sm:py-28 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

interface HeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  invert?: boolean;
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center", invert = false }: HeadingProps) {
  const alignCls = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow && (
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.18em] ${invert ? "text-white/60" : "text-brand"}`}>
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${invert ? "text-white" : "text-brand-forest"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg leading-relaxed ${invert ? "text-white/75" : "text-gray-700"}`}>{subtitle}</p>
      )}
    </div>
  );
}
