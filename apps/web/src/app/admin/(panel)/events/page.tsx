import type { Metadata } from "next";
import { Star } from "lucide-react";
import type { EventStatus } from "@wmc/shared";
import { EventActions } from "@/components/admin/actions/EventActions";
import { Badge } from "@/components/admin/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Select } from "@/components/admin/Field";
import { QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDateTime } from "@/lib/admin/format";
import { cityName, getCityMap, getProfilesByIds, load, personName } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { EventRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Events" };

const STATUSES: EventStatus[] = ["pending", "approved", "cancelled", "rejected"];
type Row = Pick<EventRow, "id" | "title" | "category" | "starts_at" | "location_name" | "city_id" | "creator_id" | "participant_count" | "max_participants" | "status" | "is_featured">;

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile } = ctx;
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as EventStatus) ? (sp.status as EventStatus) : "";
  const cityId = typeof sp.city === "string" && /^\d+$/.test(sp.city) ? Number(sp.city) : null;
  const upcoming = sp.upcoming === "1";

  const [rows, cities] = await Promise.all([
    load<Row[]>(() => {
      let q = supabase
        .from("events")
        .select("id, title, category, starts_at, location_name, city_id, creator_id, participant_count, max_participants, status, is_featured")
        .order("starts_at", { ascending: upcoming })
        .limit(200);
      if (status) q = q.eq("status", status);
      if (cityId) q = q.eq("city_id", cityId);
      if (upcoming) q = q.gte("starts_at", new Date().toISOString());
      return q;
    }),
    getCityMap(supabase),
  ]);
  const creators = await getProfilesByIds(supabase, (rows.data ?? []).map((r) => r.creator_id));
  const cityOptions = Array.from(cities.values()).sort((a, b) => a.name.localeCompare(b.name));

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Event",
      render: (e) => (
        <div className="max-w-xs">
          <p className="flex items-center gap-1.5 font-medium text-gray-900">
            {e.title}
            {e.is_featured && <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label="Featured" />}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {e.category}
            {e.location_name ? ` · ${e.location_name}` : ""}
          </p>
        </div>
      ),
    },
    { key: "starts", header: "Starts", render: (e) => <span className="whitespace-nowrap">{fmtDateTime(e.starts_at)}</span> },
    { key: "city", header: "City", render: (e) => cityName(cities, e.city_id) },
    { key: "creator", header: "Creator", render: (e) => personName(creators, e.creator_id) },
    { key: "going", header: "Going", render: (e) => `${e.participant_count}${e.max_participants ? ` / ${e.max_participants}` : ""}` },
    { key: "status", header: "Status", render: (e) => <Badge>{e.status}</Badge> },
    {
      key: "actions",
      header: "",
      render: (e) => <EventActions eventId={e.id} title={e.title} status={e.status} isFeatured={e.is_featured} isAdmin={profile.role === "admin"} />,
    },
  ];

  return (
    <>
      <PageHeader title="Events" description="Events auto-approve in the MVP; reject or cancel anything that breaks the guidelines." />
      <form method="get" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select name="status" defaultValue={status} aria-label="Status" className="sm:w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select name="city" defaultValue={cityId ?? ""} aria-label="City" className="sm:w-48">
          <option value="">All cities</option>
          {cityOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700">
          <input type="checkbox" name="upcoming" value="1" defaultChecked={upcoming} className="accent-brand" />
          Upcoming only
        </label>
        <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-forest">
          Filter
        </button>
      </form>
      {rows.error ? <QueryError message={rows.error} /> : <DataTable columns={columns} rows={rows.data ?? []} rowKey={(e) => e.id} empty="No events match these filters." />}
    </>
  );
}
