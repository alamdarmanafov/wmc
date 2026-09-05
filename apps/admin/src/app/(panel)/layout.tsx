import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { NotConfigured } from "@/components/admin/Notice";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { TopBar } from "@/components/admin/TopBar";
import { getAdminContext } from "@/lib/admin/session";

// Admin pages depend on the session cookie and live data; never prerender them.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();

  if (ctx.state === "unconfigured") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
        <Logo />
        <div className="mt-8 w-full max-w-lg">
          <NotConfigured />
        </div>
      </main>
    );
  }
  if (ctx.state === "unauthenticated") redirect("/login");
  if (ctx.state === "denied") return <AccessDenied email={ctx.user.email} role={ctx.role} />;

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-cream md:flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar profile={ctx.profile} email={ctx.user.email} />
          <main className="flex-1 px-5 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
