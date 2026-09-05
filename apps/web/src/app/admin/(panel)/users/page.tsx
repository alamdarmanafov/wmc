import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Search } from "lucide-react";
import type { UserStatus } from "@wmc/shared";
import { UserActions } from "@/components/admin/actions/UserActions";
import { Avatar } from "@/components/admin/Avatar";
import { Badge } from "@/components/admin/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Input, Select } from "@/components/admin/Field";
import { QueryError } from "@/components/admin/Notice";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDate } from "@/lib/admin/format";
import { cityName, getCityMap, load } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import type { ProfileRow } from "@/lib/database.types";

export const metadata: Metadata = { title: "Users" };

type Row = Pick<ProfileRow, "id" | "first_name" | "photo_url" | "age" | "city_id" | "role" | "status" | "is_verified" | "created_at">;

const STATUSES: UserStatus[] = ["active", "suspended", "banned"];

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile, user } = ctx;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && STATUSES.includes(sp.status as UserStatus) ? (sp.status as UserStatus) : "";

  const [users, cities] = await Promise.all([
    load<Row[]>(() => {
      let query = supabase
        .from("profiles")
        .select("id, first_name, photo_url, age, city_id, role, status, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (q) query = query.ilike("first_name", `%${q}%`);
      if (status) query = query.eq("status", status);
      return query;
    }),
    getCityMap(supabase),
  ]);

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 font-medium text-gray-900 hover:text-brand">
          <Avatar name={u.first_name} src={u.photo_url} />
          <span className="inline-flex items-center gap-1">
            {u.first_name || <span className="text-gray-500">(no name)</span>}
            {u.is_verified && <BadgeCheck className="h-4 w-4 text-brand" aria-label="Verified" />}
          </span>
        </Link>
      ),
    },
    { key: "age", header: "Age", render: (u) => u.age ?? "—" },
    { key: "city", header: "City", render: (u) => cityName(cities, u.city_id) },
    { key: "role", header: "Role", render: (u) => <Badge>{u.role}</Badge> },
    { key: "status", header: "Status", render: (u) => <Badge>{u.status}</Badge> },
    { key: "created", header: "Joined", render: (u) => <span className="text-gray-500">{fmtDate(u.created_at)}</span> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (u) => (
        <div className="flex justify-end">
          <UserActions
            userId={u.id}
            name={u.first_name}
            status={u.status}
            isVerified={u.is_verified}
            role={u.role}
            viewerRole={profile.role}
            viewerId={user.id}
            compact
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Users" description={`${users.data?.length ?? 0} shown (latest 100 matching).`} />
      <form method="get" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <Input name="q" defaultValue={q} placeholder="Search by first name…" className="pl-9" aria-label="Search users" />
        </div>
        <Select name="status" defaultValue={status} aria-label="Filter by status" className="sm:w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-forest">
          Filter
        </button>
      </form>
      {users.error ? (
        <QueryError message={users.error} />
      ) : (
        <DataTable columns={columns} rows={users.data ?? []} rowKey={(u) => u.id} empty="No users match these filters." />
      )}
    </>
  );
}
