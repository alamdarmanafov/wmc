import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Notice, QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDateTime, shortId } from "@/lib/admin/format";
import { getProfilesByIds, load, personName } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { AuditLogRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage() {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile } = ctx;

  const rows = await load<AuditLogRow[]>(() => supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(300));
  const admins = await getProfilesByIds(supabase, (rows.data ?? []).map((r) => r.admin_id));

  const columns: Column<AuditLogRow>[] = [
    { key: "when", header: "When", render: (r) => <span className="whitespace-nowrap text-gray-500">{fmtDateTime(r.created_at)}</span> },
    { key: "admin", header: "Admin", render: (r) => personName(admins, r.admin_id) },
    { key: "action", header: "Action", render: (r) => <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-900">{r.action}</code> },
    {
      key: "target",
      header: "Target",
      render: (r) =>
        r.target_type === "user" && r.target_id ? (
          <Link href={`/admin/users/${r.target_id}`} className="text-brand hover:underline">
            user {shortId(r.target_id)}
          </Link>
        ) : (
          <span className="text-gray-700">
            {r.target_type ?? "—"} {r.target_id ? shortId(r.target_id) : ""}
          </span>
        ),
    },
    { key: "meta", header: "Details", render: (r) => <code className="block max-w-md truncate text-xs text-gray-500">{JSON.stringify(r.meta)}</code> },
  ];

  return (
    <>
      <PageHeader title="Audit log" description="Every admin action, newest first (last 300)." />
      {profile.role !== "admin" && (
        <div className="mb-5">
          <Notice title="Admins only">Moderators cannot read the audit log; entries below may be empty.</Notice>
        </div>
      )}
      {rows.error ? <QueryError message={rows.error} /> : <DataTable columns={columns} rows={rows.data ?? []} rowKey={(r) => String(r.id)} empty="No admin actions recorded yet." />}
    </>
  );
}
