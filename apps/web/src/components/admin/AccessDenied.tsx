import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "./SignOutButton";

export function AccessDenied({ email, role }: { email?: string; role: string | null }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
      <Logo />
      <div className="mt-8 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-danger">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-brand-forest">Access denied</h1>
        <p className="mt-2 text-sm text-gray-700">
          {email ? <span className="font-medium">{email}</span> : "This account"} is signed in with the role{" "}
          <code className="rounded bg-gray-100 px-1">{role ?? "none"}</code>. Only admins and moderators can use this panel.
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Ask an existing admin to run{" "}
          <code className="rounded bg-gray-100 px-1">update public.profiles set role = &apos;admin&apos; where id = &apos;…&apos;</code>
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
