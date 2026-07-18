import { requireRole } from "@/lib/auth";
import { TurkeyMap } from "./turkey-map";

export default async function MapPage() {
  await requireRole("COORDINATOR");
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Harita ve Dağılım</h1>
      <TurkeyMap />
    </div>
  );
}
