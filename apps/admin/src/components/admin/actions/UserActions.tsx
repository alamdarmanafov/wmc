"use client";

import Link from "next/link";
import type { UserRole, UserStatus } from "@wmc/shared";
import { Button } from "@/components/admin/Button";
import { confirmAction, promptText } from "@/components/admin/ConfirmDialog";
import { useAdminAction } from "@/lib/admin/use-action";

interface Props {
  userId: string;
  name: string;
  status: UserStatus;
  isVerified: boolean;
  role: UserRole;
  viewerRole: UserRole;
  viewerId: string;
  compact?: boolean;
}

export function UserActions({ userId, name, status, isVerified, role, viewerRole, viewerId, compact = false }: Props) {
  const { run, pending } = useAdminAction();
  const isAdmin = viewerRole === "admin";
  const self = userId === viewerId;
  const size = compact ? "sm" : "md";

  async function setStatus(next: UserStatus) {
    const verb = next === "active" ? "Reactivate" : next === "suspended" ? "Suspend" : "Ban";
    const reason = next === "active" ? "" : promptText(`Reason to ${verb.toLowerCase()} ${name || "this user"} (optional):`);
    if (reason === null) return;
    if (!confirmAction(`${verb} ${name || "this user"}?`)) return;
    const done = next === "active" ? "reactivated" : next;
    await run(
      `status:${next}`,
      (sb) => sb.rpc("admin_set_user_status", { p_user_id: userId, p_status: next, p_reason: reason || null }),
      `User ${done}.`,
    );
  }

  async function setVerified(next: boolean) {
    await run(
      "verify",
      (sb) => sb.rpc("admin_set_user_verified", { p_user_id: userId, p_verified: next }),
      next ? "User verified." : "Verification removed.",
    );
  }

  async function setRole(next: UserRole) {
    if (!confirmAction(`Change ${name || "this user"}'s role to ${next}?`)) return;
    await run(
      `role:${next}`,
      async (sb) => {
        const res = await sb.from("profiles").update({ role: next }).eq("id", userId);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: "set_user_role", p_target_type: "user", p_target_id: userId, p_meta: { role: next } });
      },
      `Role set to ${next}.`,
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isAdmin && !self && (
        <>
          {status !== "suspended" && status !== "banned" && (
            <Button size={size} variant="danger" onClick={() => setStatus("suspended")} loading={pending === "status:suspended"}>
              Suspend
            </Button>
          )}
          {status !== "banned" && (
            <Button size={size} variant="danger" onClick={() => setStatus("banned")} loading={pending === "status:banned"}>
              Ban
            </Button>
          )}
          {status !== "active" && (
            <Button size={size} variant="success" onClick={() => setStatus("active")} loading={pending === "status:active"}>
              Reactivate
            </Button>
          )}
          <Button size={size} onClick={() => setVerified(!isVerified)} loading={pending === "verify"}>
            {isVerified ? "Unverify" : "Verify"}
          </Button>
          {role !== "moderator" && (
            <Button size={size} onClick={() => setRole("moderator")} loading={pending === "role:moderator"}>
              Make moderator
            </Button>
          )}
          {role !== "admin" && (
            <Button size={size} onClick={() => setRole("admin")} loading={pending === "role:admin"}>
              Make admin
            </Button>
          )}
          {role !== "user" && (
            <Button size={size} variant="ghost" onClick={() => setRole("user")} loading={pending === "role:user"}>
              Remove role
            </Button>
          )}
        </>
      )}
      <Link
        href={`/reports?target=${userId}`}
        className={`inline-flex items-center rounded-lg border border-gray-200 bg-white font-medium text-gray-900 hover:bg-gray-100 ${
          compact ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
        }`}
      >
        Reports
      </Link>
    </div>
  );
}
