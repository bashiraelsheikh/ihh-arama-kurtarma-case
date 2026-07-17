import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, fail, mapError, BusinessRuleError } from "@/lib/api";
import { createTrainingSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

function genCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("COORDINATOR");
    const body = await req.json();
    const confirm = body?.confirm === true;
    const input = createTrainingSchema.parse(body);

    const coordinator = await prisma.coordinatorProfile.findUnique({ where: { id: session.profileId } });
    if (!coordinator) throw new BusinessRuleError("Sorumlu profili bulunamadı.");

    const city = await prisma.city.findUnique({ where: { id: input.cityId } });
    if (!city) throw new BusinessRuleError("İl bulunamadı.");
    // Bölge kısıtı: yalnızca kendi bölgesindeki iller
    if (city.regionId !== coordinator.responsibleRegionId) {
      throw new BusinessRuleError("Yalnızca sorumlu olduğunuz bölgedeki illerde eğitim oluşturabilirsiniz.");
    }

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) throw new BusinessRuleError("Geçersiz tarih.");
    if (endAt <= startAt) throw new BusinessRuleError("Bitiş tarihi başlangıçtan sonra olmalıdır.");

    // Eğitmen uzmanlık kontrolü
    const expertise = await prisma.instructorExpertise.findFirst({
      where: { instructorId: input.instructorId, trainingCategoryId: input.categoryId },
    });
    if (!expertise) throw new BusinessRuleError("Seçilen eğitmen bu alanda uzman değil.");

    // Eğitmen geçerli sertifika kontrolü
    const validCert = await prisma.instructorCertificate.findFirst({
      where: { instructorId: input.instructorId, expiryDate: { gt: new Date() } },
    });
    if (!validCert) throw new BusinessRuleError("Seçilen eğitmenin geçerli bir sertifikası bulunmuyor.");

    // Tarih çakışması uyarısı
    const conflict = await prisma.trainingInstructor.findFirst({
      where: {
        instructorId: input.instructorId,
        training: { startAt: { lte: endAt }, endAt: { gte: startAt }, status: { not: "CANCELLED" } },
      },
      include: { training: true },
    });
    if (conflict && !confirm) {
      return fail("Eğitmenin bu tarihlerde başka bir eğitim görevi var.", 409, {
        requiresConfirm: true,
        conflictTraining: conflict.training.name,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const training = await tx.training.create({
        data: {
          trainingCode: genCode("EGT"),
          categoryId: input.categoryId,
          name: input.name,
          scope: input.scope,
          cityId: city.id,
          regionId: city.regionId,
          location: input.location,
          startAt,
          endAt,
          capacity: input.capacity,
          status: "PLANNED",
          coordinatorId: coordinator.id,
          primaryInstructorId: input.instructorId,
        },
      });
      await tx.trainingInstructor.create({
        data: { trainingId: training.id, instructorId: input.instructorId, role: "Baş Eğitmen" },
      });
      // İldeki uygun gönüllülere duyuru
      await tx.announcement.create({
        data: {
          title: `Yeni Eğitim: ${training.name}`,
          description: input.description ?? `${city.name} ilinde yeni eğitim açıldı.`,
          cityId: city.id,
          regionId: city.regionId,
          trainingCategoryId: input.categoryId,
          trainingId: training.id,
          startAt,
          endAt,
          status: "ACTIVE",
          createdByUserId: session.userId,
        },
      });
      await writeAudit(
        {
          userId: session.userId,
          action: "CREATE_TRAINING",
          entityType: "Training",
          entityId: training.id,
          newData: { name: training.name, cityId: city.id, instructorId: input.instructorId },
        },
        tx,
      );
      return training;
    });

    return ok({ trainingId: result.id });
  } catch (e) {
    return mapError(e);
  }
}
