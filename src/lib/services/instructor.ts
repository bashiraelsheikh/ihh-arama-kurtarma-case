import { prisma } from "@/lib/prisma";
import { certificateStatus } from "@/lib/business";

export async function getInstructorDashboard(instructorId: string) {
  const now = new Date();
  const profile = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
    include: {
      user: true,
      city: true,
      region: true,
      expertise: { include: { trainingCategory: true } },
      certificates: { include: { certificateType: true } },
    },
  });
  if (!profile) throw new Error("Eğitmen profili bulunamadı.");

  // Görevli olduğu eğitimler (TrainingInstructor + primaryInstructor)
  const assignments = await prisma.trainingInstructor.findMany({
    where: { instructorId },
    include: {
      training: {
        include: {
          category: true,
          city: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  const trainings = assignments.map((a) => a.training);
  const trainingIds = trainings.map((t) => t.id);

  const totalParticipants = trainings.reduce((s, t) => s + t._count.enrollments, 0);
  const completedCount = trainings.filter((t) => t.status === "COMPLETED").length;
  const plannedCount = trainings.filter((t) => t.status === "PLANNED").length;

  // Ortalama yoklama oranı (eğitmenin girdiği kayıtlardan)
  const attRecords = await prisma.attendanceRecord.findMany({
    where: { session: { trainingId: { in: trainingIds.length ? trainingIds : ["__none__"] } } },
    select: { attendancePercentage: true },
  });
  const avgAttendance =
    attRecords.length > 0
      ? Math.round(attRecords.reduce((s, r) => s + (r.attendancePercentage ?? 0), 0) / attRecords.length)
      : null;

  // Atanmış sınavlar
  const exams = await prisma.exam.findMany({
    where: { responsibleInstructorId: instructorId },
    include: { training: { include: { category: true } }, _count: { select: { results: true } } },
    orderBy: { examDate: "desc" },
  });

  return {
    profile: {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.user.email,
      code: profile.instructorCode,
      city: profile.city.name,
      region: profile.region.name,
      phone: profile.phone,
    },
    stats: {
      expertiseCount: profile.expertise.length,
      assignedTrainings: trainings.length,
      totalParticipants,
      avgAttendance,
      completedCount,
      plannedCount,
    },
    expertise: profile.expertise.map((e) => ({
      id: e.id,
      name: e.trainingCategory.name,
      level: e.level ?? "-",
    })),
    certificates: profile.certificates.map((c) => ({
      id: c.id,
      name: c.certificateType.name,
      expiryDate: c.expiryDate,
      status: certificateStatus(c.expiryDate, now),
    })),
    trainings: assignments.map((a) => ({
      id: a.training.id,
      name: a.training.name,
      category: a.training.category.name,
      level: a.training.category.level,
      city: a.training.city.name,
      location: a.training.location,
      startAt: a.training.startAt,
      endAt: a.training.endAt,
      participants: a.training._count.enrollments,
      status: a.training.status,
      role: a.role,
    })),
    exams: exams.map((e) => ({
      id: e.id,
      name: e.name,
      training: e.training.name,
      examDate: e.examDate,
      resultCount: e._count.results,
      passingScore: e.passingScore,
      maxScore: e.maxScore,
    })),
  };
}

/** Eğitmenin bir eğitime erişip erişemeyeceğini kontrol eder (kaynak sahipliği) */
export async function instructorOwnsTraining(instructorId: string, trainingId: string): Promise<boolean> {
  const found = await prisma.trainingInstructor.findFirst({ where: { instructorId, trainingId } });
  return !!found;
}

/** Eğitmenin bir sınava erişip erişemeyeceğini kontrol eder */
export async function instructorOwnsExam(instructorId: string, examId: string): Promise<boolean> {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { responsibleInstructorId: true } });
  return exam?.responsibleInstructorId === instructorId;
}

export async function getTrainingParticipants(trainingId: string) {
  const enrollments = await prisma.trainingEnrollment.findMany({
    where: { trainingId },
    include: { volunteer: true },
    orderBy: { volunteer: { firstName: "asc" } },
  });
  return enrollments.map((e) => ({
    volunteerId: e.volunteerId,
    name: `${e.volunteer.firstName} ${e.volunteer.lastName}`,
    code: e.volunteer.volunteerCode,
  }));
}

export async function getInstructorTrainingsWithParticipants(instructorId: string) {
  const assignments = await prisma.trainingInstructor.findMany({
    where: { instructorId },
    include: {
      training: {
        include: {
          city: true,
          category: true,
          enrollments: { include: { volunteer: true }, orderBy: { volunteer: { firstName: "asc" } } },
          attendanceSessions: { orderBy: { sessionDate: "asc" } },
        },
      },
    },
  });
  return assignments.map((a) => ({
    id: a.training.id,
    name: a.training.name,
    city: a.training.city.name,
    startAt: a.training.startAt,
    endAt: a.training.endAt,
    status: a.training.status,
    sessions: a.training.attendanceSessions.map((s) => ({ id: s.id, date: s.sessionDate })),
    participants: a.training.enrollments.map((e) => ({
      volunteerId: e.volunteerId,
      name: `${e.volunteer.firstName} ${e.volunteer.lastName}`,
      code: e.volunteer.volunteerCode,
    })),
  }));
}

export async function getInstructorExamsWithCandidates(instructorId: string) {
  const exams = await prisma.exam.findMany({
    where: { responsibleInstructorId: instructorId },
    include: {
      training: { include: { enrollments: { include: { volunteer: true } } } },
      results: true,
    },
    orderBy: { examDate: "desc" },
  });
  return exams.map((exam) => {
    const resultByVol = new Map(exam.results.map((r) => [r.volunteerId, r]));
    return {
      id: exam.id,
      name: exam.name,
      training: exam.training.name,
      examDate: exam.examDate,
      maxScore: exam.maxScore,
      passingScore: exam.passingScore,
      candidates: exam.training.enrollments.map((e) => {
        const existing = resultByVol.get(e.volunteerId);
        return {
          volunteerId: e.volunteerId,
          name: `${e.volunteer.firstName} ${e.volunteer.lastName}`,
          code: e.volunteer.volunteerCode,
          attended: existing?.attended === "ATTENDED",
          score: existing?.score ?? null,
          note: existing?.note ?? null,
          resultStatus: existing?.resultStatus ?? "NOT_EVALUATED",
        };
      }),
    };
  });
}

export async function getExamCandidates(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      training: {
        include: {
          enrollments: { include: { volunteer: true } },
        },
      },
      results: true,
    },
  });
  if (!exam) return [];
  const resultByVol = new Map(exam.results.map((r) => [r.volunteerId, r]));
  return exam.training.enrollments.map((e) => {
    const existing = resultByVol.get(e.volunteerId);
    return {
      volunteerId: e.volunteerId,
      name: `${e.volunteer.firstName} ${e.volunteer.lastName}`,
      code: e.volunteer.volunteerCode,
      attended: existing?.attended === "ATTENDED",
      score: existing?.score ?? null,
      note: existing?.note ?? null,
    };
  });
}
