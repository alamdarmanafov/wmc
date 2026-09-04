import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { UserActions } from "@/components/admin/actions/UserActions";
import { Avatar } from "@/components/admin/Avatar";
import { Badge } from "@/components/admin/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDateTime, shortId } from "@/lib/admin/format";
import { cityName, getCityMap } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "User" };

function Card({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-forest">
        {title}
        {typeof count === "number" && <span className="rounded-full bg-gray-100 px-2 text-xs text-gray-500">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right text-gray-900">{value}</dd>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin();
  if (!ctx) return null;
  const { supabase, profile: viewer, user: viewerUser } = ctx;
  const { id } = await params;

  const { data: p } = await supabase
    .from("profiles")
    .select(
      "id, first_name, photo_url, age, gender, city_id, bio, languages, looking_for, profession, location_visibility, role, status, status_reason, is_verified, onboarding_completed, last_active_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();

  const [cities, interestLinks, memberships, events, reports, blocks, audit] = await Promise.all([
    getCityMap(supabase),
    supabase.from("user_interests").select("interest_id").eq("user_id", id),
    supabase.from("community_members").select("community_id, role, joined_at").eq("user_id", id),
    supabase.from("events").select("id, title, starts_at, status, participant_count").eq("creator_id", id).order("starts_at", { ascending: false }).limit(20),
    supabase.from("reports").select("id, reason, status, details, created_at").eq("target_type", "user").eq("target_id", id).order("created_at", { ascending: false }),
    supabase.from("blocks").select("blocker_id", { count: "exact", head: true }).eq("blocked_id", id),
    supabase.from("admin_audit_log").select("id, action, meta, created_at").eq("target_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const interestIds = (interestLinks.data ?? []).map((r) => r.interest_id);
  const interests = interestIds.length ? (await supabase.from("interests").select("id, name, emoji").in("id", interestIds)).data ?? [] : [];
  const communityIds = (memberships.data ?? []).map((m) => m.community_id);
  const communities = communityIds.length ? (await supabase.from("communities").select("id, name, status").in("id", communityIds)).data ?? [] : [];
  const membershipRole = new Map((memberships.data ?? []).map((m) => [m.community_id, m.role]));

  return (
    <>
      <PageHeader
        title={p.first_name || "Unnamed user"}
        description={`User ${shortId(p.id)} · joined ${fmtDateTime(p.created_at)}`}
        actions={
          <UserActions
            userId={p.id}
            name={p.first_name}
            status={p.status}
            isVerified={p.is_verified}
            role={p.role}
            viewerRole={viewer.role}
            viewerId={viewerUser.id}
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Profile">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={p.first_name} src={p.photo_url} size={56} />
            <div>
              <p className="flex items-center gap-1 font-semibold text-gray-900">
                {p.first_name || "—"}
                {p.is_verified && <BadgeCheck className="h-4 w-4 text-brand" aria-label="Verified" />}
              </p>
              <div className="mt-1 flex gap-1.5">
                <Badge>{p.role}</Badge>
                <Badge>{p.status}</Badge>
              </div>
            </div>
          </div>
          <dl className="divide-y divide-gray-100">
            <Row label="Age" value={p.age ?? "—"} />
            <Row label="Gender" value={p.gender ?? "—"} />
            <Row label="City" value={cityName(cities, p.city_id)} />
            <Row label="Profession" value={p.profession ?? "—"} />
            <Row label="Languages" value={p.languages.join(", ") || "—"} />
            <Row label="Looking for" value={p.looking_for.join(", ") || "—"} />
            <Row label="Location visibility" value={p.location_visibility} />
            <Row label="Onboarding" value={p.onboarding_completed ? "Completed" : "Incomplete"} />
            <Row label="Last active" value={fmtDateTime(p.last_active_at)} />
            <Row label="Blocked by" value={`${blocks.count ?? 0} users`} />
            {p.status_reason && <Row label="Status reason" value={p.status_reason} />}
          </dl>
          {p.bio && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-gray-700">{p.bio}</p>}
        </Card>

        <div className="space-y-5">
          <Card title="Interests" count={interests.length}>
            {interests.length === 0 ? (
              <p className="text-sm text-gray-500">No interests selected.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <span key={i.id} className="rounded-full bg-brand-mint px-2.5 py-1 text-xs font-medium text-brand-forest">
                    {i.emoji} {i.name}
                  </span>
                ))}
              </div>
            )}
          </Card>
          <Card title="Communities" count={communities.length}>
            {communities.length === 0 ? (
              <p className="text-sm text-gray-500">Not a member of any community.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {communities.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/communities?status=${c.status}`} className="font-medium text-gray-900 hover:text-brand">
                      {c.name}
                    </Link>
                    <span className="flex gap-1">
                      <Badge tone="neutral">{membershipRole.get(c.id) ?? "member"}</Badge>
                      <Badge>{c.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Events created" count={events.data?.length ?? 0}>
            {!events.data?.length ? (
              <p className="text-sm text-gray-500">No events created.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {events.data.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span>
                      <span className="font-medium text-gray-900">{e.title}</span>
                      <span className="block text-xs text-gray-500">
                        {fmtDateTime(e.starts_at)} · {e.participant_count} going
                      </span>
                    </span>
                    <Badge>{e.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Reports about this user" count={reports.data?.length ?? 0}>
            {!reports.data?.length ? (
              <p className="text-sm text-gray-500">No reports.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {reports.data.map((r) => (
                  <li key={r.id} className="rounded-xl bg-cream p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-gray-900">{r.reason.replace("_", " ")}</span>
                      <Badge>{r.status}</Badge>
                    </div>
                    {r.details && <p className="mt-1 text-gray-700">{r.details}</p>}
                    <p className="mt-1 text-xs text-gray-500">{fmtDateTime(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/admin/reports?target=${p.id}`} className="mt-3 inline-block text-xs font-medium text-brand hover:underline">
              Open in reports →
            </Link>
          </Card>
          <Card title="Audit entries" count={audit.data?.length ?? 0}>
            {audit.error ? (
              <p className="text-sm text-gray-500">Audit log is visible to admins only.</p>
            ) : !audit.data?.length ? (
              <p className="text-sm text-gray-500">No admin actions yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {audit.data.map((a) => (
                  <li key={a.id}>
                    <span className="font-medium text-gray-900">{a.action}</span>
                    <span className="ml-2 text-xs text-gray-500">{fmtDateTime(a.created_at)}</span>
                    <code className="mt-0.5 block truncate text-xs text-gray-500">{JSON.stringify(a.meta)}</code>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
