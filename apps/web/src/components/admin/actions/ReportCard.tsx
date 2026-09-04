"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { REPORT_REASONS, type ReportStatus, type ReportTargetType, type UserStatus } from "@wmc/shared";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { confirmAction, promptText } from "@/components/admin/ConfirmDialog";
import { useAdminAction } from "@/lib/admin/use-action";
import { getBrowserSupabase, type WmcClient } from "@/lib/supabase/client";
import type { ReportRow } from "@/lib/database.types";

export interface ReportCardProps {
  report: ReportRow;
  reporterName: string;
  reviewerName: string | null;
  viewerId: string;
  isAdmin: boolean;
}

/** What we show for a report's target, normalised across the five target types. */
interface TargetInfo {
  title: string;
  subtitle: string;
  ownerId: string | null;
  ownerName: string | null;
  missing: boolean;
}

async function fetchTarget(sb: WmcClient, type: ReportTargetType, id: string): Promise<TargetInfo> {
  const missing = (label: string): TargetInfo => ({ title: `${label} not found`, subtitle: "It may have been deleted already.", ownerId: null, ownerName: null, missing: true });
  const nameOf = async (userId: string | null): Promise<string | null> => {
    if (!userId) return null;
    const { data } = await sb.from("profiles").select("first_name").eq("id", userId).maybeSingle();
    return data?.first_name ?? null;
  };

  switch (type) {
    case "user": {
      const { data } = await sb.from("profiles").select("id, first_name, status, bio, profession").eq("id", id).maybeSingle();
      if (!data) return missing("User");
      return { title: data.first_name || "(no name)", subtitle: [data.profession, data.bio, `status: ${data.status}`].filter(Boolean).join(" · "), ownerId: data.id, ownerName: data.first_name, missing: false };
    }
    case "event": {
      const { data } = await sb.from("events").select("id, title, description, status, creator_id").eq("id", id).maybeSingle();
      if (!data) return missing("Event");
      return { title: data.title, subtitle: [data.description, `status: ${data.status}`].filter(Boolean).join(" · "), ownerId: data.creator_id, ownerName: await nameOf(data.creator_id), missing: false };
    }
    case "community": {
      const { data } = await sb.from("communities").select("id, name, description, status, owner_id").eq("id", id).maybeSingle();
      if (!data) return missing("Community");
      return { title: data.name, subtitle: [data.description, `status: ${data.status}`].filter(Boolean).join(" · "), ownerId: data.owner_id, ownerName: await nameOf(data.owner_id), missing: false };
    }
    case "activity": {
      const { data } = await sb.from("activities").select("id, text, status, creator_id").eq("id", id).maybeSingle();
      if (!data) return missing("Activity");
      return { title: `“${data.text}”`, subtitle: `status: ${data.status}`, ownerId: data.creator_id, ownerName: await nameOf(data.creator_id), missing: false };
    }
    case "message": {
      const { data } = await sb.from("messages").select("id, content, sender_id, deleted_at, created_at").eq("id", id).maybeSingle();
      if (!data) return missing("Message");
      return { title: data.deleted_at ? "(message deleted)" : data.content, subtitle: `sent ${new Date(data.created_at).toLocaleString()}`, ownerId: data.sender_id, ownerName: await nameOf(data.sender_id), missing: false };
    }
  }
}

export function ReportCard({ report: r, reporterName, reviewerName, viewerId, isAdmin }: ReportCardProps) {
  const { run, pending } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<TargetInfo | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !target) {
      const sb = getBrowserSupabase();
      if (!sb) return;
      setLoadingTarget(true);
      try {
        setTarget(await fetchTarget(sb, r.target_type, r.target_id));
      } finally {
        setLoadingTarget(false);
      }
    }
  }

  const reasonLabel = REPORT_REASONS.find((x) => x.slug === r.reason)?.name ?? r.reason;

  function reviewPatch(status: ReportStatus, note: string | null) {
    return { status, reviewed_by: viewerId, reviewed_at: new Date().toISOString(), admin_note: note };
  }

  async function setStatus(status: ReportStatus) {
    const note = promptText(`Admin note (optional) — marking as ${status}:`, r.admin_note ?? "");
    if (note === null) return;
    await run(
      status,
      async (sb) => {
        const res = await sb.from("reports").update(reviewPatch(status, note || null)).eq("id", r.id);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: `report_${status}`, p_target_type: "report", p_target_id: r.id, p_meta: { target_type: r.target_type, target_id: r.target_id } });
      },
      `Report marked ${status}.`,
    );
  }

  async function actOnUser(userStatus: Exclude<UserStatus, "active">) {
    const userId = target?.ownerId;
    if (!userId) return;
    const who = target?.ownerName || "this user";
    const note = promptText(`Reason to ${userStatus === "banned" ? "ban" : "suspend"} ${who}:`, reasonLabel);
    if (note === null) return;
    if (!confirmAction(`${userStatus === "banned" ? "Ban" : "Suspend"} ${who} and mark this report as actioned?`)) return;
    await run(
      `user:${userStatus}`,
      async (sb) => {
        const rpc = await sb.rpc("admin_set_user_status", { p_user_id: userId, p_status: userStatus, p_reason: note || null });
        if (rpc.error) return rpc;
        return sb.from("reports").update(reviewPatch("actioned", note || null)).eq("id", r.id);
      },
      `User ${userStatus}. Report actioned.`,
    );
  }

  async function deleteContent() {
    if (!confirmAction(`Delete the reported ${r.target_type} and mark this report as actioned?`)) return;
    await run(
      "delete",
      async (sb) => {
        const id = r.target_id;
        const res =
          r.target_type === "event"
            ? await sb.from("events").delete().eq("id", id)
            : r.target_type === "community"
              ? await sb.from("communities").delete().eq("id", id)
              : r.target_type === "activity"
                ? await sb.from("activities").delete().eq("id", id)
                : await sb.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (res.error) return res;
        await sb.rpc("admin_log", { p_action: `${r.target_type}_deleted_via_report`, p_target_type: r.target_type, p_target_id: id, p_meta: { report_id: r.id } });
        return sb.from("reports").update(reviewPatch("actioned", `Deleted ${r.target_type}`)).eq("id", r.id);
      },
      "Content removed. Report actioned.",
    );
  }

  const canDeleteContent = r.target_type !== "user" && (isAdmin || r.target_type === "message");

  return (
    <article className="rounded-2xl border border-gray-200 bg-white">
      <button type="button" onClick={toggle} className="flex w-full items-start gap-4 p-4 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{r.target_type}</Badge>
            <span className="text-sm font-semibold text-gray-900">{reasonLabel}</span>
            <Badge>{r.status}</Badge>
          </div>
          {r.details && <p className="mt-1.5 line-clamp-2 text-sm text-gray-700">{r.details}</p>}
          <p className="mt-1.5 text-xs text-gray-500">
            Reported by <span className="font-medium text-gray-700">{reporterName}</span> · {new Date(r.created_at).toLocaleString()}
            {reviewerName && (
              <>
                {" "}
                · reviewed by <span className="font-medium text-gray-700">{reviewerName}</span>
              </>
            )}
          </p>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="border-t border-gray-200 bg-cream/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Reported {r.target_type}</p>
          {loadingTarget ? (
            <p className="mt-2 text-sm text-gray-500">Loading…</p>
          ) : target ? (
            <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-sm font-medium text-gray-900">{target.title}</p>
              {target.subtitle && <p className="mt-0.5 text-xs text-gray-500">{target.subtitle}</p>}
              {target.ownerId && (
                <p className="mt-1.5 text-xs text-gray-500">
                  {r.target_type === "user" ? "Profile" : "Owner"}:{" "}
                  <Link href={`/admin/users/${target.ownerId}`} className="font-medium text-brand hover:underline">
                    {target.ownerName || "view user"}
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Could not load the target.</p>
          )}
          {r.admin_note && (
            <p className="mt-3 text-xs text-gray-700">
              <span className="font-medium">Admin note:</span> {r.admin_note}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {r.status !== "reviewed" && (
              <Button size="sm" onClick={() => setStatus("reviewed")} loading={pending === "reviewed"}>
                Mark reviewed
              </Button>
            )}
            {r.status !== "dismissed" && (
              <Button size="sm" variant="ghost" onClick={() => setStatus("dismissed")} loading={pending === "dismissed"}>
                Dismiss
              </Button>
            )}
            {isAdmin && target?.ownerId && (
              <>
                <Button size="sm" variant="danger" onClick={() => actOnUser("suspended")} loading={pending === "user:suspended"}>
                  Suspend user
                </Button>
                <Button size="sm" variant="danger" onClick={() => actOnUser("banned")} loading={pending === "user:banned"}>
                  Ban user
                </Button>
              </>
            )}
            {canDeleteContent && target && !target.missing && (
              <Button size="sm" variant="danger" onClick={deleteContent} loading={pending === "delete"}>
                Delete content
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
