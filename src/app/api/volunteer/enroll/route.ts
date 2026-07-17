import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError, BusinessRuleError } from "@/lib/api";
import { enrollSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("VOLUNTEER");
    const body = await req.json();
    const { trainingId } = enrollSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const training = await tx.training.findUnique({
        where: { id: trainingId },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!training) throw new BusinessRuleError("Eğitim bulunamadı.");
      if (training.status !== "PLANNED") throw new BusinessRuleError("Bu eğitimin kayıt dönemi açık değil.");
      if (training._count.enrollments >= training.capacity) {
        throw new BusinessRuleError("Eğitim kontenjanı dolmuştur.");
      }
      const existing = await tx.trainingEnrollment.findUnique({
        where: { trainingId_volunteerId: { trainingId, volunteerId: session.profileId } },
      });
      if (existing) throw new BusinessRuleError("Bu eğitime zaten kayıtlısınız.");

      const enrollment = await tx.trainingEnrollment.create({
        data: {
          trainingId,
          volunteerId: session.profileId,
          enrollmentStatus: "ENROLLED",
          completionStatus: "NOT_COMPLETED",
        },
      });
      await writeAudit(
        {
          userId: session.userId,
          action: "ENROLL_TRAINING",
          entityType: "TrainingEnrollment",
          entityId: enrollment.id,
          newData: { trainingId, trainingName: training.name },
        },
        tx,
      );
      return enrollment;
    });

    return ok({ enrollmentId: result.id });
  } catch (e) {
    return mapError(e);
  }
}
