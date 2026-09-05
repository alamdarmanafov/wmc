import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { NotConfigured } from "@/components/admin/Notice";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
      <Logo />
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-brand-forest">Sign in to the admin panel</h1>
        <p className="mt-1 text-sm text-gray-500">For WMC admins and moderators only.</p>
        <div className="mt-6">{configured ? <LoginForm /> : <NotConfigured />}</div>
      </div>
    </main>
  );
}
