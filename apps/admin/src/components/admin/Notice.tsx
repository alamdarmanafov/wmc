import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export function Notice({ title, children, tone = "amber" }: { title: string; children?: ReactNode; tone?: "amber" | "red" }) {
  const cls = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-900";
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 text-sm ${cls}`} role="alert">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export function NotConfigured() {
  return (
    <Notice title="Supabase is not configured">
      Set <code className="rounded bg-white/60 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="rounded bg-white/60 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>) and restart the app.
    </Notice>
  );
}

export function QueryError({ message }: { message: string }) {
  return (
    <Notice title="Could not load data" tone="red">
      {message}
    </Notice>
  );
}
