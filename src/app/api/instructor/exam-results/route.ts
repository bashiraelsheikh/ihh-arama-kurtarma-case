import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError, BusinessRuleError } from "@/lib/api";
import { examResultSubmitSchema } from "@/lib/validation";
import { instructorOwnsExam } from "@/lib/services/instructor";
import { writeAudit } from "@/lib/audit";
import type { ExamResultStatus, ExamAttendanceStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("INSTRUCTOR");
    const body = await req.json();
    const input = examResultSubmitSchema.parse(body);

    const owns = await instructorOwnsExam(session.profileId, input.examId);
    if (!owns) throw new BusinessRuleError("Bu sınavın sonuçlarını girme yetkiniz yok.");

    const result = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({ where: { id: input.examId } });
      if (!exam) throw new BusinessRuleError("Sınav bulunamadı.");

      let count = 0;
      for (const r of input.results) {
        const attended: ExamAttendanceStatus = r.attended ? "ATTENDED" : "NOT_ATTENDED";
        // Sınava girmeyen için puan boş, sonuç Değerlendirilmedi
        let score: number | null = r.attended ? r.score ?? null : null;
        let passed: boolean | null = null;
        let resultStatus: ExamResultStatus = "NOT_EVALUATED";
        if (r.attended && score != null) {
          passed = score >= exam.passingScore;
          resultStatus = passed ? "PASSED" : "FAILED";
        }
        // Sadece bir aktif sonuç kaydı (upsert)
        await tx.examResult.upsert({
          where: { examId_volunteerId: { examId: input.examId, volunteerId: r.volunteerId } },
          update: { attended, score, passed, resultStatus, note: r.note ?? null, enteredByInstructorId: session.profileId, enteredAt: new Date() },
          create: {
            examId: input.examId,
            volunteerId: r.volunteerId,
            attended,
            score,
            passed,
            resultStatus,
            note: r.note ?? null,
            enteredByInstructorId: session.profileId,
          },
        });
        count++;
      }

      await writeAudit(
        {
          userId: session.userId,
          action: "SUBMIT_EXAM_RESULTS",
          entityType: "Exam",
          entityId: input.examId,
          newData: { count },
        },
        tx,
      );

      return { count };
    });

    return ok(result);
  } catch (e) {
    return mapError(e);
  }
}
