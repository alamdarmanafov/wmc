import Link from "next/link";

export interface TabItem {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1" aria-label="Tabs">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition ${
            t.active ? "bg-brand text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${t.active ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
