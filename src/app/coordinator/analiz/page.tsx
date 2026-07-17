import { requireRole } from "@/lib/auth";
import { getRegions, getCities, getCategories } from "@/lib/reference";
import { AnalyticsView } from "./analytics-view";

export default async function AnalyticsPage() {
  await requireRole("COORDINATOR");
  const [regions, cities, categories] = await Promise.all([getRegions(), getCities(), getCategories()]);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Analiz ve Raporlar</h1>
      <AnalyticsView
        regions={regions}
        cities={cities.map((c) => ({ id: c.id, name: c.name, regionId: c.regionId }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
