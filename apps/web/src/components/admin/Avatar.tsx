interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
}

export function Avatar({ name, src, size = 32 }: AvatarProps) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (src) {
    // Photos live on the user's Supabase storage host, which is not known at build time.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-forest"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
