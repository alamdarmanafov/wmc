"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  Calendar,
  Flag,
  LayoutDashboard,
  MapPin,
  ScrollText,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Logo } from "@/components/Logo";

const NAV: { href: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/users", label: "Users", Icon: Users },
  { href: "/communities", label: "Communities", Icon: Building2 },
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/activities", label: "Activities", Icon: Activity },
  { href: "/reports", label: "Reports", Icon: Flag },
  { href: "/cities", label: "Cities", Icon: MapPin },
  { href: "/audit", label: "Audit log", Icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white md:h-screen md:w-60 md:border-b-0 md:border-r md:sticky md:top-0">
      <div className="flex h-16 items-center px-5">
        <Logo href="/" size={32} />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0" aria-label="Admin">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-brand-mint text-brand-forest" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-brand" : "text-gray-500"}`} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden px-5 py-4 text-xs text-gray-500 md:block">
        <Link href="/" className="hover:text-brand-forest">
          ← Back to website
        </Link>
      </div>
    </aside>
  );
}
