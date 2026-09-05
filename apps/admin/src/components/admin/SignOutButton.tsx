"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "./Button";

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} loading={busy} className={className}>
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      Sign out
    </Button>
  );
}
