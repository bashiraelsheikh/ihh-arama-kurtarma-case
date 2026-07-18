import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { ok, fail, mapError } from "@/lib/api";
import { getCityDetail } from "@/lib/services/coordinator";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ cityId: string }> }) {
  try {
    await requireApiRole("COORDINATOR");
    const { cityId } = await params;
    const detail = await getCityDetail(cityId);
    if (!detail) return fail("İl bulunamadı.", 404);
    return ok(detail);
  } catch (e) {
    return mapError(e);
  }
}
