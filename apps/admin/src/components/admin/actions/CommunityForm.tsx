"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { COMMUNITY_CATEGORIES, slugify } from "@wmc/shared";
import { Button } from "@/components/admin/Button";
import { Input, Label, Select, Textarea } from "@/components/admin/Field";
import { useAdminAction } from "@/lib/admin/use-action";

interface Props {
  cities: { id: number; name: string }[];
  ownerId: string;
}

const initial = { name: "", description: "", category: "general", city_id: "" };

/** Creates a community owned by the current admin. RLS requires inserting as pending, then it is approved in a second step. */
export function CommunityForm({ cities, ownerId }: Props) {
  const { run, pending } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const ok = await run(
      "create",
      async (sb) => {
        const inserted = await sb
          .from("communities")
          .insert({
            name: form.name.trim(),
            slug,
            description: form.description.trim() || null,
            category: form.category,
            city_id: form.city_id ? Number(form.city_id) : null,
            owner_id: ownerId,
            status: "pending",
          })
          .select("id")
          .single();
        if (inserted.error) return inserted;
        const id = inserted.data.id;
        const approved = await sb.from("communities").update({ status: "approved" }).eq("id", id);
        if (approved.error) return approved;
        await sb.from("community_members").insert({ community_id: id, user_id: ownerId });
        return sb.rpc("admin_log", { p_action: "community_created", p_target_type: "community", p_target_id: id, p_meta: { name: form.name } });
      },
      "Community created and approved.",
    );
    if (ok) {
      setForm(initial);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New community
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h2 className="text-sm font-semibold text-brand-forest">Create community</h2>
        <p className="text-xs text-gray-500">You will be the owner. It is approved immediately.</p>
      </div>
      <div>
        <Label htmlFor="new-name">Name</Label>
        <Input id="new-name" required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="new-category">Category</Label>
        <Select id="new-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {COMMUNITY_CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.emoji} {cat.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="new-city">City</Label>
        <Select id="new-city" value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}>
          <option value="">No city (global)</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="new-desc">Description</Label>
        <Textarea id="new-desc" rows={3} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" loading={pending === "create"}>
          Create
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
