import type { Metadata } from "next";
import Link from "next/link";
import type { AdminStats } from "@wmc/shared";
import { DashboardChart } from "@/components/admin/DashboardChart";
import { QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { fmtNumber } from "@/lib/admin/format";
import { load } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { SignupsByDayRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase } = ctx;

  const [stats, series] = await Promise.all([
    load<AdminStats[]>(() => supabase.rpc("admin_dashboard_stats")),
    load<SignupsByDayRow[]>(() => supabase.rpc("admin_signups_by_day", { p_days: 30 })),
  ]);

  const s: AdminStats | null = stats.data?.[0] ?? null;

  return (
    <>
      <PageHeader title="Dashboard" description="A snapshot of the community right now." />

      {stats.error && <div className="mb-6"><QueryError message={stats.error} /></div>}

      {s && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={fmtNumber(s.total_users)} hint={`+${fmtNumber(s.new_users_7d)} this week`} />
          <StatCard label="Active 7d / 30d" value={`${fmtNumber(s.active_users_7d)} / ${fmtNumber(s.active_users_30d)}`} />
          <StatCard label="New 7d / 30d" value={`${fmtNumber(s.new_users_7d)} / ${fmtNumber(s.new_users_30d)}`} />
          <StatCard label="Retention D7 / D30" value={`${s.retention_d7}% / ${s.retention_d30}%`} />
          <StatCard label="Communities" value={fmtNumber(s.communities)} hint={`${fmtNumber(s.pending_communities)} pending approval`} />
          <StatCard label="Events" value={fmtNumber(s.events)} hint={`${fmtNumber(s.upcoming_events)} upcoming · ${fmtNumber(s.pending_events)} pending`} />
          <StatCard label="Connections" value={fmtNumber(s.connections)} />
          <StatCard label="Messages" value={fmtNumber(s.messages)} />
          <Link href="/admin/reports" className="block rounded-2xl transition hover:-translate-y-0.5">
            <StatCard label="Pending reports" value={fmtNumber(s.pending_reports)} hint="Open the moderation queue →" />
          </Link>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-brand-forest">Last 30 days</h2>
          <p className="text-xs text-gray-500">Daily signups and active users.</p>
        </div>
        {series.error ? <QueryError message={series.error} /> : <DashboardChart rows={series.data ?? []} />}
      </section>
    </>
  );
}
