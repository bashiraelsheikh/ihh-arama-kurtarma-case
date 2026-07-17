import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError } from "@/lib/api";
import {
  getKpis,
  getCompetencyAnalysis,
  getMonthlyTrainingSeries,
  getPredictions,
  type AnalyticsFilters,
} from "@/lib/services/coordinator";

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("COORDINATOR");
    const sp = req.nextUrl.searchParams;
    const filters: AnalyticsFilters = {
      regionId: sp.get("regionId") || undefined,
      cityId: sp.get("cityId") || undefined,
      categoryId: sp.get("categoryId") || undefined,
    };
    const [kpis, competency, monthly, predictions] = await Promise.all([
      getKpis(filters),
      getCompetencyAnalysis(filters),
      getMonthlyTrainingSeries(),
      getPredictions(),
    ]);
    return ok({ kpis, competency, monthly, predictions });
  } catch (e) {
    return mapError(e);
  }
}
