import { cn } from "@/lib/cn";

export function Logo({
  size = "md",
  variant = "dark",
  subtitle,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  subtitle?: string;
}) {
  const iconSize = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  const textColor = variant === "light" ? "text-white" : "text-brand";
  const subColor = variant === "light" ? "text-blue-100" : "text-slate-500";
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex items-center justify-center rounded-lg bg-accent shadow", iconSize)}>
        <svg viewBox="0 0 24 24" className="h-2/3 w-2/3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 3 7v6c0 5 3.5 8 9 9 5.5-1 9-4 9-9V7l-9-5Z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={cn("font-bold tracking-tight", textSize, textColor)}>İHH</div>
        <div className={cn("text-[11px] font-semibold uppercase tracking-widest text-accent")}>Arama Kurtarma</div>
        {subtitle && <div className={cn("text-[11px] font-medium", subColor)}>{subtitle}</div>}
      </div>
    </div>
  );
}
