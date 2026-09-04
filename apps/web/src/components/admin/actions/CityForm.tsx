"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { slugify } from "@wmc/shared";
import { Button } from "@/components/admin/Button";
import { Input, Label } from "@/components/admin/Field";
import { useAdminAction } from "@/lib/admin/use-action";

const initial = { name: "", country_code: "", country_name: "", lat: "", lng: "", timezone: "UTC" };

export function CityForm() {
  const { run, pending } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = form.country_code.trim().toUpperCase();
    const ok = await run(
      "create",
      async (sb) => {
        // Find or create the country by ISO code.
        const existing = await sb.from("countries").select("id").eq("code", code).maybeSingle();
        if (existing.error) return existing;
        let countryId = existing.data?.id;
        if (!countryId) {
          const created = await sb.from("countries").insert({ code, name: form.country_name.trim() || code }).select("id").single();
          if (created.error) return created;
          countryId = created.data.id;
        }
        const inserted = await sb
          .from("cities")
          .insert({
            country_id: countryId,
            name: form.name.trim(),
            slug: slugify(`${form.name}-${code}`),
            lat: Number(form.lat),
            lng: Number(form.lng),
            timezone: form.timezone.trim() || "UTC",
          })
          .select("id")
          .single();
        if (inserted.error) return inserted;
        return sb.rpc("admin_log", { p_action: "city_created", p_target_type: "city", p_target_id: String(inserted.data.id), p_meta: { name: form.name } });
      },
      "City added.",
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
        Add city
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
      <div className="sm:col-span-3">
        <h2 className="text-sm font-semibold text-brand-forest">Add a city</h2>
        <p className="text-xs text-gray-500">The country is created automatically if the ISO code is new.</p>
      </div>
      <div>
        <Label htmlFor="city-name">City name</Label>
        <Input id="city-name" required value={form.name} onChange={set("name")} placeholder="Manchester" />
      </div>
      <div>
        <Label htmlFor="city-cc">Country code (ISO-2)</Label>
        <Input id="city-cc" required minLength={2} maxLength={2} value={form.country_code} onChange={set("country_code")} placeholder="GB" className="uppercase" />
      </div>
      <div>
        <Label htmlFor="city-cn">Country name (if new)</Label>
        <Input id="city-cn" value={form.country_name} onChange={set("country_name")} placeholder="United Kingdom" />
      </div>
      <div>
        <Label htmlFor="city-lat">Latitude</Label>
        <Input id="city-lat" required type="number" step="any" min={-90} max={90} value={form.lat} onChange={set("lat")} placeholder="53.4808" />
      </div>
      <div>
        <Label htmlFor="city-lng">Longitude</Label>
        <Input id="city-lng" required type="number" step="any" min={-180} max={180} value={form.lng} onChange={set("lng")} placeholder="-2.2426" />
      </div>
      <div>
        <Label htmlFor="city-tz">Timezone</Label>
        <Input id="city-tz" required value={form.timezone} onChange={set("timezone")} placeholder="Europe/London" />
      </div>
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" variant="primary" loading={pending === "create"}>
          Add city
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
