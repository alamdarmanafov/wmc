import { Apple, Play } from "lucide-react";

interface StoreButtonsProps {
  className?: string;
  size?: "md" | "lg";
}

const base =
  "group inline-flex items-center gap-3 rounded-full bg-ink text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

export function StoreButtons({ className = "", size = "lg" }: StoreButtonsProps) {
  const pad = size === "lg" ? "px-5 py-3" : "px-4 py-2.5";
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a href="#download" className={`${base} ${pad}`} aria-label="Download on the App Store">
        <Apple className="h-6 w-6" aria-hidden="true" />
        <span className="flex flex-col leading-none">
          <span className="text-[10px] font-medium text-white/70">Download on the</span>
          <span className="text-[15px] font-semibold">App Store</span>
        </span>
      </a>
      <a href="#download" className={`${base} ${pad}`} aria-label="Get it on Google Play">
        <Play className="h-5 w-5 fill-current" aria-hidden="true" />
        <span className="flex flex-col leading-none">
          <span className="text-[10px] font-medium text-white/70">Get it on</span>
          <span className="text-[15px] font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
