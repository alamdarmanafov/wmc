import type { Metadata } from "next";
import Link from "next/link";
import type { ReportStatus } from "@wmc/shared";
import { ReportCard } from "@/components/admin/actions/ReportCard";
import { QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs } from "@/components/admin/Tabs";
import { getProfilesByIds, load, personName } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { ReportRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Reports" };

const STATUSES: ReportStatus[] = ["pending", "reviewed", "actioned", "dismissed"];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile, user } = ctx;
  const sp = await searchParams;
  const target = typeof sp.target === "string" && /^[0-9a-f-]{36}$/i.test(sp.target) ? sp.target : null;
  const status: ReportStatus | "all" = target ? "all" : STATUSES.includes(sp.status as ReportStatus) ? (sp.status as ReportStatus) : "pending";

  const [rows, counts] = await Promise.all([
    load<ReportRow[]>(() => {
      let q = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
      if (target) q = q.eq("target_id", target);
      else if (status !== "all") q = q.eq("status", status);
      return q;
    }),
    Promise.all(STATUSES.map((s) => supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", s))),
  ]);
  const people = await getProfilesByIds(supabase, (rows.data ?? []).flatMap((r) => [r.reporter_id, r.reviewed_by]));

  return (
    <>
      <PageHeader
        title="Reports"
        description={target ? "All reports about one target." : "Every report is reviewed by a human. Expand a report to see what was reported."}
        actions={
          target ? (
            <Link href="/admin/reports" className="text-sm font-medium text-brand hover:underline">
              ← Back to queue
            </Link>
          ) : undefined
        }
      />
      {!target && (
        <Tabs
          items={STATUSES.map((s, i) => ({
            label: s[0].toUpperCase() + s.slice(1),
            href: `/admin/reports?status=${s}`,
            active: s === status,
            count: counts[i].count ?? 0,
          }))}
        />
      )}
      {rows.error ? (
        <QueryError message={rows.error} />
      ) : !rows.data?.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          {target ? "No reports about this target." : `No ${status} reports. The community is quiet.`}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.data.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              reporterName={personName(people, r.reporter_id)}
              reviewerName={r.reviewed_by ? personName(people, r.reviewed_by) : null}
              viewerId={user.id}
              isAdmin={profile.role === "admin"}
            />
          ))}
        </div>
      )}
    </>
  );
}
