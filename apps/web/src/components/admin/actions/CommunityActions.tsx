"use client";

import { useState } from "react";
import { COMMUNITY_CATEGORIES, type CommunityStatus } from "@wmc/shared";
import { Button } from "@/components/admin/Button";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { Input, Label, Select, Textarea } from "@/components/admin/Field";
import { useAdminAction } from "@/lib/admin/use-action";
import type { CommunityRow } from "@/lib/database.types";

interface CityOption {
  id: number;
  name: string;
}

interface Props {
  community: Pick<CommunityRow, "id" | "name" | "description" | "category" | "city_id" | "status" | "is_featured">;
  cities: CityOption[];
  isAdmin: boolean;
}

export function CommunityActions({ community: c, cities, isAdmin }: Props) {
  const { run, pending } = useAdminAction();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: c.name,
    description: c.description ?? "",
    category: c.category,
    city_id: c.city_id ? String(c.city_id) : "",
  });

  async function setStatus(status: CommunityStatus) {
    if (!confirmAction(`${status === "approved" ? "Approve" : "Reject"} “${c.name}”?`)) return;
    await run(
      status,
      async (sb) => {
        const res = await sb.from("communities").update({ status }).eq("id", c.id);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: `community_${status}`, p_target_type: "community", p_target_id: c.id, p_meta: { name: c.name } });
      },
      `Community ${status}.`,
    );
  }

  async function toggleFeatured() {
    const next = !c.is_featured;
    await run(
      "feature",
      async (sb) => {
        const res = await sb.from("communities").update({ is_featured: next }).eq("id", c.id);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: next ? "community_featured" : "community_unfeatured", p_target_type: "community", p_target_id: c.id });
      },
      next ? "Community featured." : "Community unfeatured.",
    );
  }

  async function save() {
    const ok = await run(
      "save",
      async (sb) => {
        const res = await sb
          .from("communities")
          .update({
            name: form.name.trim(),
            description: form.description.trim() || null,
            category: form.category,
            city_id: form.city_id ? Number(form.city_id) : null,
          })
          .eq("id", c.id);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: "community_edited", p_target_type: "community", p_target_id: c.id });
      },
      "Community updated.",
    );
    if (ok) setEditing(false);
  }

  async function remove() {
    if (!confirmAction(`Delete “${c.name}” permanently? Members and events links will be removed.`)) return;
    await run(
      "delete",
      async (sb) => {
        const res = await sb.from("communities").delete().eq("id", c.id);
        if (res.error) return res;
        return sb.rpc("admin_log", { p_action: "community_deleted", p_target_type: "community", p_target_id: c.id, p_meta: { name: c.name } });
      },
      "Community deleted.",
    );
  }

  if (editing) {
    return (
      <div className="w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-cream p-4">
        <div>
          <Label htmlFor={`name-${c.id}`}>Name</Label>
          <Input id={`name-${c.id}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} />
        </div>
        <div>
          <Label htmlFor={`desc-${c.id}`}>Description</Label>
          <Textarea id={`desc-${c.id}`} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`cat-${c.id}`}>Category</Label>
            <Select id={`cat-${c.id}`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {COMMUNITY_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`city-${c.id}`}>City</Label>
            <Select id={`city-${c.id}`} value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
              <option value="">No city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={save} loading={pending === "save"} disabled={form.name.trim().length < 2}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {c.status !== "approved" && (
        <Button size="sm" variant="success" onClick={() => setStatus("approved")} loading={pending === "approved"}>
          Approve
        </Button>
      )}
      {c.status !== "rejected" && (
        <Button size="sm" variant="danger" onClick={() => setStatus("rejected")} loading={pending === "rejected"}>
          Reject
        </Button>
      )}
      <Button size="sm" onClick={toggleFeatured} loading={pending === "feature"}>
        {c.is_featured ? "Unfeature" : "Feature"}
      </Button>
      <Button size="sm" onClick={() => setEditing(true)}>
        Edit
      </Button>
      {isAdmin && (
        <Button size="sm" variant="danger" onClick={remove} loading={pending === "delete"}>
          Delete
        </Button>
      )}
    </div>
  );
}
