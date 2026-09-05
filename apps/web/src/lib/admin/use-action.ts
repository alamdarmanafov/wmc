"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase, type WmcClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/Toast";

type Result = { error: { message: string } | null };

/**
 * Small helper for admin action buttons: runs a Supabase mutation with the browser client,
 * shows a toast, refreshes server data. Keeps every action component tiny.
 */
export function useAdminAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);

  async function run(name: string, fn: (supabase: WmcClient) => PromiseLike<Result>, successMessage: string): Promise<boolean> {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return false;
    }
    setPending(name);
    try {
      const { error } = await fn(supabase);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unexpected error");
      return false;
    } finally {
      setPending(null);
    }
  }

  return { run, pending };
}
