import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError, BusinessRuleError } from "@/lib/api";
import { attendanceSubmitSchema } from "@/lib/validation";
import { attendanceStatusToPercentage } from "@/lib/business";
import { instructorOwnsTraining } from "@/lib/services/instructor";
import { parseTrDate } from "@/lib/datetime";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("INSTRUCTOR");
    const body = await req.json();
    const input = attendanceSubmitSchema.parse(body);

    // Kaynak sahipliği kontrolü
    const owns = await instructorOwnsTraining(session.profileId, input.trainingId);
    if (!owns) throw new BusinessRuleError("Bu eğitime yoklama girme yetkiniz yok.");

    const sessionDate = parseTrDate(input.sessionDate) ?? new Date(input.sessionDate);
    if (isNaN(sessionDate.getTime())) throw new BusinessRuleError("Geçersiz oturum tarihi.");

    const result = await prisma.$transaction(async (tx) => {
      // Oturumu upsert et (aynı gün için mükerrer oluşturma)
      const attendanceSession = await tx.attendanceSession.upsert({
        where: { trainingId_sessionDate: { trainingId: input.trainingId, sessionDate } },
        update: { startTime: input.startTime ?? undefined, endTime: input.endTime ?? undefined },
        create: {
          trainingId: input.trainingId,
          sessionDate,
          startTime: input.startTime ?? undefined,
          endTime: input.endTime ?? undefined,
          createdByInstructorId: session.profileId,
        },
      });

      let updatedCount = 0;
      for (const r of input.records) {
        const pct = r.attendancePercentage ?? attendanceStatusToPercentage(r.status);
        await tx.attendanceRecord.upsert({
          where: {
            attendanceSessionId_volunteerId: {
              attendanceSessionId: attendanceSession.id,
              volunteerId: r.volunteerId,
            },
          },
          update: { status: r.status, attendancePercentage: pct, note: r.note ?? null, enteredByInstructorId: session.profileId },
          create: {
            attendanceSessionId: attendanceSession.id,
            volunteerId: r.volunteerId,
            status: r.status,
            attendancePercentage: pct,
            note: r.note ?? null,
            enteredByInstructorId: session.profileId,
          },
        });
        updatedCount++;
      }

      // Katılım yüzdesini (enrollment) tüm oturumların ortalaması olarak güncelle
      for (const r of input.records) {
        const agg = await tx.attendanceRecord.aggregate({
          where: { volunteerId: r.volunteerId, session: { trainingId: input.trainingId } },
          _avg: { attendancePercentage: true },
        });
        await tx.trainingEnrollment.updateMany({
          where: { trainingId: input.trainingId, volunteerId: r.volunteerId },
          data: { attendancePercentage: Math.round(agg._avg.attendancePercentage ?? 0) },
        });
      }

      await writeAudit(
        {
          userId: session.userId,
          action: "SUBMIT_ATTENDANCE",
          entityType: "AttendanceSession",
          entityId: attendanceSession.id,
          newData: { trainingId: input.trainingId, sessionDate: input.sessionDate, records: updatedCount },
        },
        tx,
      );

      return { sessionId: attendanceSession.id, updatedCount };
    });

    return ok(result);
  } catch (e) {
    return mapError(e);
  }
}
