import { prisma } from "@/lib/prisma";
import {
  phoneFreshness,
  certificateStatus,
  computeGroupProgress,
  highestCompletedLevel,
  nextRecommendedInGroup,
} from "@/lib/business";
import { FULL_CATALOG, CATALOG_GROUPS } from "@/lib/catalog";

/** Sertifika adından katalog eğitim adını çıkarır */
function certToCatalogName(certName: string): string {
  return certName.replace(/ (Katılım|Eğitmen) Sertifikası$/u, "").trim();
}

const catalogNameSet = new Set(FULL_CATALOG.map((c) => c.name));

export async function getCompletedCatalogNames(volunteerId: string): Promise<Set<string>> {
  const [certs, enrollments] = await Promise.all([
    prisma.volunteerCertificate.findMany({
      where: { volunteerId },
      select: { certificateType: { select: { name: true } }, area: true },
    }),
    prisma.trainingEnrollment.findMany({
      where: { volunteerId, completionStatus: "COMPLETED" },
      select: { training: { select: { category: { select: { name: true } } } } },
    }),
  ]);
  const completed = new Set<string>();
  for (const c of certs) {
    const base = certToCatalogName(c.certificateType.name);
    if (catalogNameSet.has(base)) completed.add(base);
  }
  for (const e of enrollments) {
    if (catalogNameSet.has(e.training.category.name)) completed.add(e.training.category.name);
  }
  return completed;
}

export async function getVolunteerDashboard(volunteerId: string) {
  const now = new Date();
  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: volunteerId },
    include: { city: { include: { region: true } }, region: true, user: true },
  });
  if (!profile) throw new Error("Gönüllü profili bulunamadı.");

  const completed = await getCompletedCatalogNames(volunteerId);

  // Sertifikalar
  const certificates = await prisma.volunteerCertificate.findMany({
    where: { volunteerId },
    include: { certificateType: true },
    orderBy: { expiryDate: "asc" },
  });
  const certView = certificates.map((c) => ({
    id: c.id,
    name: c.certificateType.name,
    number: c.certificateNumber,
    issueDate: c.issueDate,
    expiryDate: c.expiryDate,
    status: certificateStatus(c.expiryDate, now),
  }));
  const validCount = certView.filter((c) => c.status === "VALID").length;
  const expiringCount = certView.filter((c) => c.status === "EXPIRING_SOON").length;
  const expiredCount = certView.filter((c) => c.status === "EXPIRED").length;

  // Eğitim tamamlama
  const groupProgress = computeGroupProgress(completed);
  const totalCatalog = FULL_CATALOG.length;
  const completedCount = groupProgress.reduce((s, g) => s + g.completed, 0);
  const completionPct = Math.round((completedCount / totalCatalog) * 100);

  // Eksik eğitimler + sonraki öneri (seviye bağımlılığı)
  const missing: { name: string; group: string; recommended: boolean }[] = [];
  for (const group of CATALOG_GROUPS) {
    if (group === "Temel Eğitimler") {
      for (const entry of FULL_CATALOG.filter((c) => c.groupName === group)) {
        if (!completed.has(entry.name)) missing.push({ name: entry.name, group, recommended: true });
      }
    } else {
      const highest = highestCompletedLevel(completed, group);
      const next = nextRecommendedInGroup(completed, group);
      for (const entry of FULL_CATALOG.filter((c) => c.groupName === group)) {
        if ((entry.level ?? 0) > highest) {
          missing.push({ name: entry.name, group, recommended: next?.name === entry.name });
        }
      }
    }
  }

  // Telefon güncelliği
  const phone = phoneFreshness(profile.phoneUpdatedAt, now);

  // Aktif operasyonlar
  const operationAssignments = await prisma.operationAssignment.findMany({
    where: { volunteerId },
    include: { operation: { include: { city: true, region: true, requiredTrainingCategory: true } } },
    orderBy: { invitedAt: "desc" },
  });
  const activeOperations = operationAssignments.filter(
    (a) => a.operation.status === "ACTIVE",
  ).length;

  // Yaklaşan / önerilen eğitimler (duyurular)
  const enrolledTrainingIds = (
    await prisma.trainingEnrollment.findMany({ where: { volunteerId }, select: { trainingId: true } })
  ).map((e) => e.trainingId);

  const candidateTrainings = await prisma.training.findMany({
    where: {
      status: "PLANNED",
      startAt: { gte: now },
      OR: [{ regionId: profile.regionId }, { cityId: profile.cityId }],
      id: { notIn: enrolledTrainingIds.length ? enrolledTrainingIds : undefined },
    },
    include: {
      category: true,
      city: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { startAt: "asc" },
    take: 30,
  });
  const upcoming = candidateTrainings
    .filter((t) => !completed.has(t.category.name)) // tamamlamadığı
    .filter((t) => t._count.enrollments < t.capacity) // kontenjan dolmamış
    .map((t) => ({
      id: t.id,
      name: t.name,
      city: t.city.name,
      location: t.location,
      startAt: t.startAt,
      endAt: t.endAt,
      capacity: t.capacity,
      enrolled: t._count.enrollments,
      remaining: t.capacity - t._count.enrollments,
    }));

  // Kayıtlı eğitimler
  const myEnrollments = await prisma.trainingEnrollment.findMany({
    where: { volunteerId },
    include: { training: { include: { category: true, city: true } } },
    orderBy: { enrolledAt: "desc" },
  });

  return {
    profile: {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.user.email,
      phone: profile.phone,
      phoneUpdatedAt: profile.phoneUpdatedAt,
      city: profile.city.name,
      region: profile.region.name,
      volunteerCode: profile.volunteerCode,
    },
    stats: {
      completedCount,
      totalCatalog,
      completionPct,
      validCertificates: validCount,
      expiringCertificates: expiringCount,
      expiredCertificates: expiredCount,
      missingCount: missing.length,
      activeOperations,
      phoneStatus: phone,
    },
    groupProgress,
    missing,
    certificates: certView,
    phone,
    operations: operationAssignments.map((a) => ({
      assignmentId: a.id,
      operationName: a.operation.name,
      city: a.operation.city?.name ?? "-",
      region: a.operation.region?.name ?? "-",
      status: a.operation.status,
      invitationStatus: a.invitationStatus,
      requiredCategory: a.operation.requiredTrainingCategory?.name ?? null,
      startAt: a.operation.startAt,
    })),
    upcoming,
    enrollments: myEnrollments.map((e) => ({
      id: e.id,
      training: e.training.name,
      city: e.training.city.name,
      startAt: e.training.startAt,
      status: e.training.status,
      completionStatus: e.completionStatus,
      attendancePercentage: e.attendancePercentage,
    })),
  };
}
