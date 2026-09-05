"use client";

import type { EventStatus } from "@wmc/shared";
import { Button } from "@/components/admin/Button";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { useAdminAction } from "@/lib/admin/use-action";

interface Props {
  eventId: string;
  title: string;
  status: EventStatus;
  isFeatured: boolean;
  isAdmin: boolean;
}

export function EventActions({ eventId, title, status, isFeatured, isAdmin }: Props) {
  const { run, pending } = useAdminAction();

  async function setStatus(next: EventStatus) {
    const verb = next === "approved" ? "Approve" : next === "rejected" ? "Reject" : "Cancel";
    if (!confirmAction(`${verb} “${title}”?`)) return;
    await run(
      next,
      async (sb) => {
        const res = await sb.from("events").update({ status: next }).eq("id", eventId);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: `event_${next}`, p_target_type: "event", p_target_id: eventId, p_meta: { title } });
      },
      `Event ${next}.`,
    );
  }

  async function toggleFeatured() {
    const next = !isFeatured;
    await run(
      "feature",
      async (sb) => {
        const res = await sb.from("events").update({ is_featured: next }).eq("id", eventId);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: next ? "event_featured" : "event_unfeatured", p_target_type: "event", p_target_id: eventId });
      },
      next ? "Event featured." : "Event unfeatured.",
    );
  }

  async function remove() {
    if (!confirmAction(`Delete “${title}” permanently?`)) return;
    await run(
      "delete",
      async (sb) => {
        const res = await sb.from("events").delete().eq("id", eventId);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: "event_deleted", p_target_type: "event", p_target_id: eventId, p_meta: { title } });
      },
      "Event deleted.",
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status !== "approved" && (
        <Button size="sm" variant="success" onClick={() => setStatus("approved")} loading={pending === "approved"}>
          Approve
        </Button>
      )}
      {status === "pending" && (
        <Button size="sm" variant="danger" onClick={() => setStatus("rejected")} loading={pending === "rejected"}>
          Reject
        </Button>
      )}
      {status === "approved" && (
        <Button size="sm" variant="danger" onClick={() => setStatus("cancelled")} loading={pending === "cancelled"}>
          Cancel
        </Button>
      )}
      <Button size="sm" onClick={toggleFeatured} loading={pending === "feature"}>
        {isFeatured ? "Unfeature" : "Feature"}
      </Button>
      {isAdmin && (
        <Button size="sm" variant="danger" onClick={remove} loading={pending === "delete"}>
          Delete
        </Button>
      )}
    </div>
  );
}
