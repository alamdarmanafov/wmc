"use client";

import { Button } from "@/components/admin/Button";
import { useAdminAction } from "@/lib/admin/use-action";

export function CityToggle({ cityId, name, isActive }: { cityId: number; name: string; isActive: boolean }) {
  const { run, pending } = useAdminAction();
  const next = !isActive;
  return (
    <Button
      size="sm"
      variant={isActive ? "danger" : "success"}
      loading={pending === "toggle"}
      onClick={() =>
        run(
          "toggle",
          async (sb) => {
            const res = await sb.from("cities").update({ is_active: next }).eq("id", cityId);
            if (res.error) return res;
            return sb.rpc("admin_log", { p_action: next ? "city_activated" : "city_deactivated", p_target_type: "city", p_target_id: String(cityId), p_meta: { name } });
          },
          `${name} ${next ? "activated" : "deactivated"}.`,
        )
      }
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
