import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { SignOutButton } from "./SignOutButton";
import type { AdminProfile } from "@/lib/admin/session";

export function TopBar({ profile, email }: { profile: AdminProfile; email: string | undefined }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-5 backdrop-blur sm:px-8">
      <p className="text-sm text-gray-500">Admin panel</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar name={profile.first_name} src={profile.photo_url} size={28} />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-gray-900">{profile.first_name || email || "Admin"}</p>
            {email && <p className="text-xs text-gray-500">{email}</p>}
          </div>
          <Badge>{profile.role}</Badge>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
