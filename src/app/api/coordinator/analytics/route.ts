import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError } from "@/lib/api";
import {
  getKpis,
  getCompetencyAnalysis,
  getMonthlyTrainingSeries,
  getPredictions,
  getFieldAnalysis,
  getCityAnalysis,
  getInstructorAnalysis,
  getAllTrainings,
  type AnalyticsFilters,
} from "@/lib/services/coordinator";

function parseDate(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("COORDINATOR");
    const sp = req.nextUrl.searchParams;
    const scope = sp.get("scope"); // "overview" (dashboard) | "full" (analiz)
    const endDate = parseDate(sp.get("endDate"));
    // Bitiş tarihini günün sonuna çek
    if (endDate) endDate.setHours(23, 59, 59, 999);
    const filters: AnalyticsFilters = {
      regionId: sp.get("regionId") || undefined,
      cityId: sp.get("cityId") || undefined,
      categoryId: sp.get("categoryId") || undefined,
      startDate: parseDate(sp.get("startDate")),
      endDate,
    };

    if (scope === "overview") {
      const kpis = await getKpis(filters);
      return ok({ kpis });
    }

    const [kpis, competency, monthly, predictions, fieldAnalysis, cityAnalysis, instructorAnalysis, allTrainings] =
      await Promise.all([
        getKpis(filters),
        getCompetencyAnalysis(filters),
        getMonthlyTrainingSeries(),
        getPredictions(),
        getFieldAnalysis(filters),
        getCityAnalysis(filters),
        getInstructorAnalysis(filters),
        getAllTrainings(filters),
      ]);
    return ok({ kpis, competency, monthly, predictions, fieldAnalysis, cityAnalysis, instructorAnalysis, allTrainings });
  } catch (e) {
    return mapError(e);
  }
}
