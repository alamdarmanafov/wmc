import type { Metadata } from "next";
import { Star } from "lucide-react";
import { COMMUNITY_CATEGORIES, type CommunityStatus } from "@wmc/shared";
import { CommunityActions } from "@/components/admin/actions/CommunityActions";
import { CommunityForm } from "@/components/admin/actions/CommunityForm";
import { Badge } from "@/components/admin/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs } from "@/components/admin/Tabs";
import { fmtDate } from "@/lib/admin/format";
import { cityName, getCityMap, getProfilesByIds, load, personName } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { CommunityRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Communities" };

const STATUSES: CommunityStatus[] = ["pending", "approved", "rejected"];
type Row = Pick<CommunityRow, "id" | "name" | "slug" | "description" | "category" | "city_id" | "owner_id" | "status" | "is_featured" | "member_count" | "created_at">;

export default async function CommunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile, user } = ctx;
  const sp = await searchParams;
  const status: CommunityStatus = STATUSES.includes(sp.status as CommunityStatus) ? (sp.status as CommunityStatus) : "pending";

  const [rows, cities, counts] = await Promise.all([
    load<Row[]>(() =>
      supabase
        .from("communities")
        .select("id, name, slug, description, category, city_id, owner_id, status, is_featured, member_count, created_at")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(200),
    ),
    getCityMap(supabase),
    Promise.all(STATUSES.map((s) => supabase.from("communities").select("id", { count: "exact", head: true }).eq("status", s))),
  ]);
  const owners = await getProfilesByIds(supabase, (rows.data ?? []).map((r) => r.owner_id));
  const cityOptions = Array.from(cities.values()).map((c) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
  const categoryLabel = (slug: string) => {
    const c = COMMUNITY_CATEGORIES.find((x) => x.slug === slug);
    return c ? `${c.emoji} ${c.name}` : slug;
  };

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Community",
      render: (c) => (
        <div className="max-w-xs">
          <p className="flex items-center gap-1.5 font-medium text-gray-900">
            {c.name}
            {c.is_featured && <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label="Featured" />}
          </p>
          {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{c.description}</p>}
        </div>
      ),
    },
    { key: "category", header: "Category", render: (c) => <span className="whitespace-nowrap">{categoryLabel(c.category)}</span> },
    { key: "city", header: "City", render: (c) => cityName(cities, c.city_id) },
    { key: "owner", header: "Owner", render: (c) => personName(owners, c.owner_id) },
    { key: "members", header: "Members", render: (c) => c.member_count },
    { key: "created", header: "Created", render: (c) => <span className="text-gray-500">{fmtDate(c.created_at)}</span> },
    {
      key: "actions",
      header: "",
      render: (c) => <CommunityActions community={c} cities={cityOptions} isAdmin={profile.role === "admin"} />,
    },
  ];

  return (
    <>
      <PageHeader title="Communities" description="Approve new communities, feature the best ones." actions={<CommunityForm cities={cityOptions} ownerId={user.id} />} />
      <Tabs
        items={STATUSES.map((s, i) => ({
          label: s[0].toUpperCase() + s.slice(1),
          href: `/admin/communities?status=${s}`,
          active: s === status,
          count: counts[i].count ?? 0,
        }))}
      />
      {rows.error ? (
        <QueryError message={rows.error} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows.data ?? []}
          rowKey={(c) => c.id}
          empty={
            <span>
              No {status} communities. <Badge>{status}</Badge> is empty.
            </span>
          }
        />
      )}
    </>
  );
}
