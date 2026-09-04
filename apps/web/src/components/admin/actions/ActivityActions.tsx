"use client";

import { Button } from "@/components/admin/Button";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { useAdminAction } from "@/lib/admin/use-action";

interface Props {
  activityId: string;
  text: string;
  isOpen: boolean;
  isAdmin: boolean;
}

export function ActivityActions({ activityId, text, isOpen, isAdmin }: Props) {
  const { run, pending } = useAdminAction();

  async function close() {
    if (!confirmAction("Close this “Join me” post?")) return;
    await run(
      "close",
      async (sb) => {
        const res = await sb.from("activities").update({ status: "closed" }).eq("id", activityId);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: "activity_closed", p_target_type: "activity", p_target_id: activityId, p_meta: { text } });
      },
      "Activity closed.",
    );
  }

  async function remove() {
    if (!confirmAction("Delete this post permanently?")) return;
    await run(
      "delete",
      async (sb) => {
        const res = await sb.from("activities").delete().eq("id", activityId);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: "activity_deleted", p_target_type: "activity", p_target_id: activityId, p_meta: { text } });
      },
      "Activity deleted.",
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isOpen && (
        <Button size="sm" onClick={close} loading={pending === "close"}>
          Close
        </Button>
      )}
      {isAdmin && (
        <Button size="sm" variant="danger" onClick={remove} loading={pending === "delete"}>
          Delete
        </Button>
      )}
    </div>
  );
}
