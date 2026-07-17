import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError } from "@/lib/api";
import { phoneUpdateSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("VOLUNTEER");
    const body = await req.json();
    const { phone } = phoneUpdateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.volunteerProfile.findUnique({ where: { id: session.profileId } });
      const profile = await tx.volunteerProfile.update({
        where: { id: session.profileId },
        data: { phone, phoneUpdatedAt: new Date() },
      });
      await writeAudit(
        {
          userId: session.userId,
          action: "UPDATE_PHONE",
          entityType: "VolunteerProfile",
          entityId: profile.id,
          oldData: { phone: before?.phone },
          newData: { phone },
        },
        tx,
      );
      return profile;
    });

    return ok({ phone: updated.phone, phoneUpdatedAt: updated.phoneUpdatedAt });
  } catch (e) {
    return mapError(e);
  }
}
