import type { Metadata } from "next";
import type { ActivityStatus } from "@wmc/shared";
import { ActivityActions } from "@/components/admin/actions/ActivityActions";
import { Badge } from "@/components/admin/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs } from "@/components/admin/Tabs";
import { fmtAgo, fmtDateTime } from "@/lib/admin/format";
import { cityName, getCityMap, getProfilesByIds, load, personName } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { ActivityRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Activities" };

const TABS: { key: ActivityStatus | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];
type Row = Pick<ActivityRow, "id" | "creator_id" | "city_id" | "text" | "category" | "happens_at" | "location_name" | "participant_count" | "status" | "expires_at" | "created_at">;

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile } = ctx;
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.status)?.key ?? "open";

  const [rows, cities] = await Promise.all([
    load<Row[]>(() => {
      let q = supabase
        .from("activities")
        .select("id, creator_id, city_id, text, category, happens_at, location_name, participant_count, status, expires_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (tab !== "all") q = q.eq("status", tab);
      return q;
    }),
    getCityMap(supabase),
  ]);
  const creators = await getProfilesByIds(supabase, (rows.data ?? []).map((r) => r.creator_id));

  const columns: Column<Row>[] = [
    {
      key: "text",
      header: "Post",
      render: (a) => (
        <div className="max-w-sm">
          <p className="font-medium text-gray-900">“{a.text}”</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {a.category}
            {a.location_name ? ` · ${a.location_name}` : ""}
            {a.happens_at ? ` · ${fmtDateTime(a.happens_at)}` : ""}
          </p>
        </div>
      ),
    },
    { key: "creator", header: "Posted by", render: (a) => personName(creators, a.creator_id) },
    { key: "city", header: "City", render: (a) => cityName(cities, a.city_id) },
    { key: "in", header: "In", render: (a) => a.participant_count },
    { key: "expires", header: "Expires", render: (a) => <span className="whitespace-nowrap text-gray-500">{fmtDateTime(a.expires_at)}</span> },
    { key: "created", header: "Posted", render: (a) => <span className="whitespace-nowrap text-gray-500">{fmtAgo(a.created_at)}</span> },
    { key: "status", header: "Status", render: (a) => <Badge>{a.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (a) => <ActivityActions activityId={a.id} text={a.text} isOpen={a.status === "open"} isAdmin={profile.role === "admin"} />,
    },
  ];

  return (
    <>
      <PageHeader title="Activities" description="“Join me” posts — lightweight, time-boxed plans." />
      <Tabs items={TABS.map((t) => ({ label: t.label, href: `/admin/activities?status=${t.key}`, active: t.key === tab }))} />
      {rows.error ? <QueryError message={rows.error} /> : <DataTable columns={columns} rows={rows.data ?? []} rowKey={(a) => a.id} empty="No activities here." />}
    </>
  );
}
