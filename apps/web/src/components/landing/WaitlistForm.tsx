"use client";

import { FormEvent, useState } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; stored: boolean } | { kind: "error"; message: string };

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city }),
      });
      const json = (await res.json()) as { ok: boolean; stored?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setState({ kind: "error", message: json.error ?? "Something went wrong. Please try again." });
        return;
      }
      setState({ kind: "done", stored: json.stored ?? false });
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  if (state.kind === "done") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-white" role="status">
        <CircleCheck className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium">You&apos;re on the list. We&apos;ll email you when WMC opens in your city.</span>
      </div>
    );
  }

  const busy = state.kind === "loading";

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="waitlist-email">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none"
        />
        <label className="sr-only" htmlFor="waitlist-city">
          Your city (optional)
        </label>
        <input
          id="waitlist-city"
          type="text"
          autoComplete="address-level2"
          placeholder="Your city (optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-12 rounded-full border border-white/20 bg-white/10 px-5 text-white placeholder:text-white/50 focus:border-white/50 focus:outline-none sm:w-52"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-brand-forest transition hover:bg-brand-mint disabled:opacity-70"
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Join the waitlist
        </button>
      </div>
      <p className="mt-3 min-h-5 text-sm text-white/60" aria-live="polite">
        {state.kind === "error" ? <span className="text-red-200">{state.message}</span> : "No spam. One email when we launch near you."}
      </p>
    </form>
  );
}
