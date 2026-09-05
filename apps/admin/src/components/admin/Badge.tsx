import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue" | "brand";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-700 ring-gray-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  brand: "bg-brand-mint text-brand-forest ring-brand-soft",
};

/** Maps any status-like string to a colour tone. */
export function toneFor(status: string): BadgeTone {
  switch (status) {
    case "active":
    case "approved":
    case "open":
    case "accepted":
    case "actioned":
      return "green";
    case "pending":
    case "suspended":
    case "reviewed":
      return "amber";
    case "banned":
    case "rejected":
    case "cancelled":
      return "red";
    case "closed":
    case "dismissed":
      return "neutral";
    case "admin":
      return "brand";
    case "moderator":
      return "blue";
    default:
      return "neutral";
  }
}

export function Badge({ children, tone, className = "" }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  const t = tone ?? (typeof children === "string" ? toneFor(children) : "neutral");
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tones[t]} ${className}`}>
      {children}
    </span>
  );
}
