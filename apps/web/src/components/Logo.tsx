import Image from "next/image";
import Link from "next/link";
import { brand } from "@wmc/shared";

interface LogoProps {
  href?: string;
  size?: number;
  /** Show the small "World Muslim Community" line under the wordmark */
  subtitle?: boolean;
  invert?: boolean;
  className?: string;
}

export function Logo({ href = "/", size = 36, subtitle = true, invert = false, className = "" }: LogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo.png"
        alt={`${brand.name} logo`}
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-[22%]"
        style={{ width: size, height: size }}
      />
      <span className="flex flex-col leading-none">
        <span className={`text-[17px] font-bold tracking-tight ${invert ? "text-white" : "text-brand-forest"}`}>
          {brand.name}
        </span>
        {subtitle && (
          <span className={`mt-0.5 text-[11px] font-medium ${invert ? "text-white/70" : "text-gray-500"}`}>
            {brand.fullName}
          </span>
        )}
      </span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label={`${brand.name} — ${brand.fullName}`} className="inline-flex">
      {content}
    </Link>
  ) : (
    content
  );
}
