import { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError } from "@/lib/api";
import { getMapData } from "@/lib/services/coordinator";

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("COORDINATOR");
    const metric = req.nextUrl.searchParams.get("metric") ?? "volunteers";
    const data = await getMapData(metric);
    return ok(data);
  } catch (e) {
    return mapError(e);
  }
}
