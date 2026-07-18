import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, fail, mapError, BusinessRuleError } from "@/lib/api";
import { createExamSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

function genCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("COORDINATOR");
    const body = await req.json();
    const confirm = body?.confirm === true;
    const input = createExamSchema.parse(body);

    const coordinator = await prisma.coordinatorProfile.findUnique({ where: { id: session.profileId } });
    if (!coordinator) throw new BusinessRuleError("Sorumlu profili bulunamadı.");

    const training = await prisma.training.findUnique({
      where: { id: input.trainingId },
      include: { category: true, city: true },
    });
    if (!training) throw new BusinessRuleError("Eğitim bulunamadı.");

    // Eğitmen uzmanlık kontrolü (sınav eğitimin alanında olmalı)
    const expertise = await prisma.instructorExpertise.findFirst({
      where: { instructorId: input.responsibleInstructorId, trainingCategoryId: training.categoryId },
    });
    if (!expertise) throw new BusinessRuleError("Seçilen eğitmen bu sınavın alanında uzman değil.");

    // Aynı eğitim + aynı sınav türünde mükerrer engeli
    const duplicate = await prisma.exam.findFirst({
      where: { trainingId: input.trainingId, examType: input.examType },
    });
    if (duplicate) {
      throw new BusinessRuleError("Bu eğitim için aynı türde bir sınav zaten oluşturulmuş.");
    }

    // Eğitim tamamlanmadan sınav oluşturuluyorsa uyarı
    if (training.status !== "COMPLETED" && !confirm) {
      return fail("Eğitim henüz tamamlanmadı. Yine de sınav oluşturmak istiyor musunuz?", 409, {
        requiresConfirm: true,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          examCode: genCode("SNV"),
          trainingId: training.id,
          name: input.name,
          examType: input.examType,
          content: input.content ?? null,
          scope: input.scope ?? training.category.name, // alan otomatik
          learningObjectives: input.learningObjectives ?? null,
          instructions: input.instructions ?? null,
          questionCount: input.questionCount ?? null,
          durationMinutes: input.durationMinutes ?? null,
          examDate: new Date(input.examDate),
          cityId: training.cityId,
          location: input.location,
          maxScore: input.maxScore,
          passingScore: input.passingScore,
          responsibleInstructorId: input.responsibleInstructorId,
          createdByCoordinatorId: coordinator.id,
          status: "PLANNED",
        },
      });

      // Eğitim katılımcılarını sınav adayı olarak otomatik bağla
      const enrollments = await tx.trainingEnrollment.findMany({
        where: { trainingId: training.id },
        select: { volunteerId: true },
      });
      if (enrollments.length > 0) {
        await tx.examResult.createMany({
          data: enrollments.map((e) => ({
            examId: exam.id,
            volunteerId: e.volunteerId,
            attended: "NOT_ATTENDED" as const,
            resultStatus: "NOT_EVALUATED" as const,
          })),
          skipDuplicates: true,
        });
      }

      await writeAudit(
        {
          userId: session.userId,
          action: "CREATE_EXAM",
          entityType: "Exam",
          entityId: exam.id,
          newData: {
            name: exam.name,
            trainingId: training.id,
            instructorId: input.responsibleInstructorId,
            candidates: enrollments.length,
          },
        },
        tx,
      );
      return { exam, candidates: enrollments.length };
    });

    return ok({ examId: result.exam.id, candidates: result.candidates });
  } catch (e) {
    return mapError(e);
  }
}
