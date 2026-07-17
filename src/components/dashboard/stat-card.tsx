import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "green" | "yellow" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    default: "text-slate-800",
    green: "text-green-600",
    yellow: "text-amber-600",
    red: "text-red-600",
    blue: "text-accent",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", tones[tone])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-800">{children}</h2>
      {action}
    </div>
  );
}
