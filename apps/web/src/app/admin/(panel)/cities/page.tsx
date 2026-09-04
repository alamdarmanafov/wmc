import type { Metadata } from "next";
import { CityForm } from "@/components/admin/actions/CityForm";
import { CityToggle } from "@/components/admin/actions/CityToggle";
import { Badge } from "@/components/admin/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Notice, QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { getCountries, load } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { CityRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Cities" };

export default async function CitiesPage() {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile } = ctx;
  const isAdmin = profile.role === "admin";

  const [cities, countries] = await Promise.all([
    load<CityRow[]>(() => supabase.from("cities").select("*").order("name")),
    getCountries(supabase),
  ]);
  const countryById = new Map(countries.map((c) => [c.id, c]));

  const columns: Column<CityRow>[] = [
    { key: "name", header: "City", render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
    {
      key: "country",
      header: "Country",
      render: (c) => {
        const co = countryById.get(c.country_id);
        return co ? `${co.name} (${co.code})` : `#${c.country_id}`;
      },
    },
    { key: "coords", header: "Lat / Lng", render: (c) => <span className="tabular-nums text-gray-500">{c.lat.toFixed(4)}, {c.lng.toFixed(4)}</span> },
    { key: "tz", header: "Timezone", render: (c) => c.timezone },
    { key: "active", header: "Status", render: (c) => <Badge tone={c.is_active ? "green" : "neutral"}>{c.is_active ? "active" : "inactive"}</Badge> },
    { key: "actions", header: "", render: (c) => (isAdmin ? <CityToggle cityId={c.id} name={c.name} isActive={c.is_active} /> : null) },
  ];

  return (
    <>
      <PageHeader title="Cities" description="Where WMC is live. Only active cities are offered during onboarding." actions={isAdmin ? <CityForm /> : undefined} />
      {!isAdmin && (
        <div className="mb-5">
          <Notice title="Read-only">Only admins can add or toggle cities.</Notice>
        </div>
      )}
      {cities.error ? <QueryError message={cities.error} /> : <DataTable columns={columns} rows={cities.data ?? []} rowKey={(c) => String(c.id)} empty="No cities yet. Add your first launch city." />}
    </>
  );
}
