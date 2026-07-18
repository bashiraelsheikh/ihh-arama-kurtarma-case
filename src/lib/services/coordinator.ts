import { prisma } from "@/lib/prisma";
import { phoneFreshness, certificateStatus } from "@/lib/business";
import { daysBetween } from "@/lib/datetime";

export async function getCoordinatorContext(profileId: string) {
  const c = await prisma.coordinatorProfile.findUnique({
    where: { id: profileId },
    include: { responsibleRegion: true, city: true },
  });
  if (!c) throw new Error("Sorumlu profili bulunamadı.");
  return c;
}

/** Sorumlunun bölgesindeki iller */
export async function getRegionCities(regionId: string) {
  return prisma.city.findMany({ where: { regionId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

/** Bir kategori için uygun eğitmenler (uzmanlık + geçerli belge) */
export async function getEligibleInstructors(categoryId: string) {
  const now = new Date();
  const instructors = await prisma.instructorProfile.findMany({
    where: {
      status: "ACTIVE",
      expertise: { some: { trainingCategoryId: categoryId } },
      certificates: { some: { expiryDate: { gt: now } } },
    },
    include: { city: true },
    orderBy: { firstName: "asc" },
  });
  return instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
    city: i.city.name,
    code: i.instructorCode,
  }));
}

/** Tüm aktif eğitmenler (uzmanlık bilgisiyle) - form için */
export async function getAllInstructorsWithExpertise() {
  const now = new Date();
  const instructors = await prisma.instructorProfile.findMany({
    where: { status: "ACTIVE" },
    include: {
      city: true,
      expertise: { select: { trainingCategoryId: true } },
      certificates: { where: { expiryDate: { gt: now } }, select: { id: true } },
    },
    orderBy: { firstName: "asc" },
  });
  return instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
    city: i.city.name,
    code: i.instructorCode,
    categoryIds: i.expertise.map((e) => e.trainingCategoryId),
    hasValidCert: i.certificates.length > 0,
  }));
}

export async function getCoordinatorTrainings(regionId: string) {
  const trainings = await prisma.training.findMany({
    where: { regionId },
    include: {
      category: true,
      city: true,
      primaryInstructor: true,
      _count: { select: { enrollments: true, exams: true } },
    },
    orderBy: { startAt: "desc" },
  });
  return trainings.map((t) => ({
    id: t.id,
    code: t.trainingCode,
    name: t.name,
    category: t.category.name,
    city: t.city.name,
    location: t.location,
    startAt: t.startAt,
    endAt: t.endAt,
    capacity: t.capacity,
    enrolled: t._count.enrollments,
    examCount: t._count.exams,
    instructor: t.primaryInstructor ? `${t.primaryInstructor.firstName} ${t.primaryInstructor.lastName}` : "-",
    status: t.status,
    categoryId: t.categoryId,
  }));
}

/** Sınav oluşturma için eğitim listesi (sınavı olmayan tamamlanmış eğitimler vurgulanır) */
export async function getExamCreationTrainings(regionId: string) {
  const trainings = await prisma.training.findMany({
    where: { regionId },
    include: { category: true, city: true, _count: { select: { exams: true, enrollments: true } } },
    orderBy: { startAt: "desc" },
  });
  return trainings.map((t) => ({
    id: t.id,
    name: t.name,
    categoryId: t.categoryId,
    category: t.category.name,
    city: t.city.name,
    location: t.location,
    endAt: t.endAt.toISOString(),
    status: t.status,
    examCount: t._count.exams,
    enrolled: t._count.enrollments,
    needsExam: t.status === "COMPLETED" && t._count.exams === 0,
  }));
}

export async function getCoordinatorExams(coordinatorId: string) {
  const exams = await prisma.exam.findMany({
    where: { createdByCoordinatorId: coordinatorId },
    include: {
      training: { include: { category: true } },
      responsibleInstructor: true,
      _count: { select: { results: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return exams.map((e) => ({
    id: e.id,
    code: e.examCode,
    name: e.name,
    training: e.training.name,
    examType: e.examType,
    examDate: e.examDate,
    location: e.location,
    passingScore: e.passingScore,
    maxScore: e.maxScore,
    instructor: e.responsibleInstructor ? `${e.responsibleInstructor.firstName} ${e.responsibleInstructor.lastName}` : "-",
    candidates: e._count.results,
    status: e.status,
  }));
}

export async function getRegionVolunteers(regionId: string) {
  const now = new Date();
  const volunteers = await prisma.volunteerProfile.findMany({
    where: { regionId },
    include: {
      city: true,
      _count: { select: { enrollments: true, certificates: true } },
    },
    orderBy: { firstName: "asc" },
  });
  return volunteers.map((v) => ({
    code: v.volunteerCode,
    name: `${v.firstName} ${v.lastName}`,
    city: v.city.name,
    phone: v.phone,
    phoneStatus: phoneFreshness(v.phoneUpdatedAt, now),
    enrollments: v._count.enrollments,
    certificates: v._count.certificates,
    status: v.status,
  }));
}

export interface AnalyticsFilters {
  regionId?: string;
  cityId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
}

/** startAt için tarih aralığı where koşulu (verilmişse) */
function dateRangeWhere(filters: AnalyticsFilters): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};
  if (filters.startDate) range.gte = filters.startDate;
  if (filters.endDate) range.lte = filters.endDate;
  return Object.keys(range).length ? range : undefined;
}

export async function getKpis(filters: AnalyticsFilters = {}) {
  const now = new Date();
  const volWhere = {
    ...(filters.regionId ? { regionId: filters.regionId } : {}),
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
  };
  const range = dateRangeWhere(filters);
  const trainingWhere = {
    ...(filters.regionId ? { regionId: filters.regionId } : {}),
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(range ? { startAt: range } : {}),
  };

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  // Yeni kayıt: tarih aralığı verilmişse ona göre, yoksa son 6 ay
  const newVolWhere = {
    ...volWhere,
    createdAt: range ?? { gte: sixMonthsAgo },
  };

  const [
    totalVolunteers,
    activeVolunteers,
    newVolunteers,
    totalInstructors,
    totalTrainings,
    completedTrainings,
    upcomingTrainings,
    examRows,
  ] = await Promise.all([
    prisma.volunteerProfile.count({ where: volWhere }),
    prisma.volunteerProfile.count({ where: { ...volWhere, status: "ACTIVE" } }),
    prisma.volunteerProfile.count({ where: newVolWhere }),
    prisma.instructorProfile.count({
      where: { ...(filters.regionId ? { regionId: filters.regionId } : {}), ...(filters.cityId ? { cityId: filters.cityId } : {}) },
    }),
    prisma.training.count({ where: trainingWhere }),
    prisma.training.count({ where: { ...trainingWhere, status: "COMPLETED" } }),
    prisma.training.count({
      where: {
        ...trainingWhere,
        status: "PLANNED",
        startAt: { gte: now, ...(filters.endDate ? { lte: filters.endDate } : {}) },
      },
    }),
    // Sınavlar eğitim üzerinden filtrelenir (bölge/il/alan/tarih)
    prisma.exam.findMany({
      where: {
        training: {
          ...(filters.regionId ? { regionId: filters.regionId } : {}),
          ...(filters.cityId ? { cityId: filters.cityId } : {}),
          ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        },
        ...(range ? { examDate: range } : {}),
      },
      select: { results: { select: { attended: true, resultStatus: true } } },
    }),
  ]);

  const allResults = examRows.flatMap((e) => e.results);
  const attended = allResults.filter((r) => r.attended === "ATTENDED").length;
  const passed = allResults.filter((r) => r.resultStatus === "PASSED").length;
  const passRate = attended > 0 ? Math.round((passed / attended) * 100) : 0;

  return {
    totalVolunteers,
    activeVolunteers,
    newVolunteers,
    totalInstructors,
    totalTrainings,
    completedTrainings,
    upcomingTrainings,
    totalExams: examRows.length,
    examAttendees: attended,
    passRate,
  };
}

/** İl bazlı harita verisi (heat map için) */
export async function getMapData(metric: string) {
  const cities = await prisma.city.findMany({
    include: {
      region: true,
      _count: { select: { volunteers: true, instructors: true, trainings: true } },
      volunteers: { select: { status: true } },
    },
  });

  // Sınav başarı oranı il bazında
  const examResults = await prisma.examResult.findMany({
    include: { exam: { select: { cityId: true } } },
  });
  const passByCity = new Map<string, { attended: number; passed: number }>();
  for (const r of examResults) {
    const cid = r.exam.cityId;
    if (!cid) continue;
    const cur = passByCity.get(cid) ?? { attended: 0, passed: 0 };
    if (r.attended === "ATTENDED") {
      cur.attended++;
      if (r.resultStatus === "PASSED") cur.passed++;
    }
    passByCity.set(cid, cur);
  }

  const opByCity = new Map<string, number>();
  const ops = await prisma.operation.findMany({ where: { status: "ACTIVE" }, select: { cityId: true } });
  for (const o of ops) if (o.cityId) opByCity.set(o.cityId, (opByCity.get(o.cityId) ?? 0) + 1);

  return cities.map((c) => {
    const active = c.volunteers.filter((v) => v.status === "ACTIVE").length;
    const pass = passByCity.get(c.id);
    const passRate = pass && pass.attended > 0 ? Math.round((pass.passed / pass.attended) * 100) : 0;
    let value = 0;
    switch (metric) {
      case "activeVolunteers":
        value = active;
        break;
      case "trainings":
        value = c._count.trainings;
        break;
      case "instructors":
        value = c._count.instructors;
        break;
      case "passRate":
        value = passRate;
        break;
      case "operations":
        value = opByCity.get(c.id) ?? 0;
        break;
      case "volunteers":
      default:
        value = c._count.volunteers;
    }
    return {
      cityId: c.id,
      name: c.name,
      region: c.region.name,
      lat: c.latitude ?? 39,
      lng: c.longitude ?? 35,
      value,
      volunteers: c._count.volunteers,
      activeVolunteers: active,
      instructors: c._count.instructors,
      trainings: c._count.trainings,
      passRate,
      operations: opByCity.get(c.id) ?? 0,
    };
  });
}

/** Bir ilin detay analizi (haritada tıklama) */
export async function getCityDetail(cityId: string) {
  const now = new Date();
  const city = await prisma.city.findUnique({ where: { id: cityId }, include: { region: true } });
  if (!city) return null;

  const [totalVol, activeVol, instructors, trainings, upcoming, enrollments] = await Promise.all([
    prisma.volunteerProfile.count({ where: { cityId } }),
    prisma.volunteerProfile.count({ where: { cityId, status: "ACTIVE" } }),
    prisma.instructorProfile.count({ where: { cityId } }),
    prisma.training.count({ where: { cityId } }),
    prisma.training.findMany({
      where: { cityId, status: "PLANNED", startAt: { gte: now } },
      include: { category: true },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    prisma.trainingEnrollment.findMany({
      where: { completionStatus: "COMPLETED", volunteer: { cityId } },
      include: { training: { include: { category: true } } },
    }),
  ]);

  // Alan bazlı güçlü/zayıf
  const areaCounts = new Map<string, number>();
  for (const e of enrollments) {
    const g = e.training.category.groupName;
    areaCounts.set(g, (areaCounts.get(g) ?? 0) + 1);
  }
  const sorted = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Sınav başarı oranı
  const examResults = await prisma.examResult.findMany({
    where: { exam: { cityId } },
    select: { attended: true, resultStatus: true },
  });
  const att = examResults.filter((r) => r.attended === "ATTENDED").length;
  const pass = examResults.filter((r) => r.resultStatus === "PASSED").length;

  // Yenilenmesi gereken sertifika ihtiyacı
  const certs = await prisma.volunteerCertificate.findMany({
    where: { volunteer: { cityId } },
    select: { expiryDate: true },
  });
  const renewNeeded = certs.filter((c) => {
    const s = certificateStatus(c.expiryDate, now);
    return s === "EXPIRED" || s === "EXPIRING_SOON";
  }).length;

  return {
    name: city.name,
    region: city.region.name,
    totalVol,
    activeVol,
    instructors,
    trainings,
    upcoming: upcoming.map((t) => ({ id: t.id, name: t.name, startAt: t.startAt })),
    strongAreas: sorted.slice(0, 3).map(([g, n]) => ({ group: g, count: n })),
    weakAreas: sorted.slice(-3).reverse().map(([g, n]) => ({ group: g, count: n })),
    passRate: att > 0 ? Math.round((pass / att) * 100) : 0,
    renewNeeded,
  };
}

/** Gönüllü yetkinlik analizi: alan/seviye bazlı dağılım */
export async function getCompetencyAnalysis(filters: AnalyticsFilters = {}) {
  const enrollments = await prisma.trainingEnrollment.findMany({
    where: {
      completionStatus: "COMPLETED",
      ...(filters.regionId ? { volunteer: { regionId: filters.regionId } } : {}),
      ...(filters.cityId ? { volunteer: { cityId: filters.cityId } } : {}),
    },
    include: { training: { include: { category: true } } },
  });

  const byGroup = new Map<string, number>();
  const byArea = new Map<string, number>();
  for (const e of enrollments) {
    const cat = e.training.category;
    byGroup.set(cat.groupName, (byGroup.get(cat.groupName) ?? 0) + 1);
    byArea.set(cat.name, (byArea.get(cat.name) ?? 0) + 1);
  }

  // Alan bazlı gönüllü dağılımı (uzmanlık alanına göre)
  const volunteers = await prisma.volunteerProfile.groupBy({
    by: ["cityId"],
    _count: true,
    where: {
      ...(filters.regionId ? { regionId: filters.regionId } : {}),
    },
  });

  const areaSorted = [...byArea.entries()].sort((a, b) => b[1] - a[1]);

  // Sertifikası yakında dolacak + telefon güncel olmayan
  const now = new Date();
  const [certs, phones] = await Promise.all([
    prisma.volunteerCertificate.findMany({
      where: { ...(filters.regionId ? { volunteer: { regionId: filters.regionId } } : {}) },
      select: { expiryDate: true },
    }),
    prisma.volunteerProfile.findMany({
      where: { ...(filters.regionId ? { regionId: filters.regionId } : {}) },
      select: { phoneUpdatedAt: true },
    }),
  ]);
  const expiringSoon = certs.filter((c) => certificateStatus(c.expiryDate, now) === "EXPIRING_SOON").length;
  const outdatedPhones = phones.filter((p) => phoneFreshness(p.phoneUpdatedAt, now) !== "CURRENT").length;

  return {
    byGroup: [...byGroup.entries()].map(([group, count]) => ({ group, count })),
    topAreas: areaSorted.slice(0, 5).map(([area, count]) => ({ area, count })),
    weakAreas: areaSorted.slice(-5).reverse().map(([area, count]) => ({ area, count })),
    expiringSoon,
    outdatedPhones,
    volunteerCityGroups: volunteers.length,
  };
}

/** Eğitmen performans analizi */
export async function getInstructorAnalysis(filters: AnalyticsFilters = {}) {
  const instructors = await prisma.instructorProfile.findMany({
    where: {
      ...(filters.regionId ? { regionId: filters.regionId } : {}),
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
    },
    include: {
      city: true,
      region: true,
      expertise: { include: { trainingCategory: true } },
      trainingAssignments: {
        include: { training: { include: { _count: { select: { enrollments: true } }, exams: { include: { results: true } } } } },
      },
    },
  });

  return instructors.map((i) => {
    const trainings = i.trainingAssignments.map((a) => a.training);
    const participants = trainings.reduce((s, t) => s + t._count.enrollments, 0);
    const cancelled = trainings.filter((t) => t.status === "CANCELLED").length;
    // Sınav puanları
    let scoreSum = 0;
    let scoreCount = 0;
    let passed = 0;
    let attended = 0;
    for (const t of trainings) {
      for (const ex of t.exams) {
        for (const r of ex.results) {
          if (r.attended === "ATTENDED" && r.score != null) {
            scoreSum += r.score;
            scoreCount++;
            attended++;
            if (r.resultStatus === "PASSED") passed++;
          }
        }
      }
    }
    return {
      id: i.id,
      name: `${i.firstName} ${i.lastName}`,
      city: i.city.name,
      region: i.region.name,
      expertise: i.expertise.map((e) => e.trainingCategory.name),
      trainingCount: trainings.length,
      participants,
      avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
      passRate: attended > 0 ? Math.round((passed / attended) * 100) : null,
      cancelRate: trainings.length > 0 ? Math.round((cancelled / trainings.length) * 100) : 0,
    };
  });
}

/** Eğitim alanı (kategori) bazlı analiz */
export async function getFieldAnalysis(filters: AnalyticsFilters = {}) {
  const range = dateRangeWhere(filters);
  const trainings = await prisma.training.findMany({
    where: {
      ...(filters.regionId ? { regionId: filters.regionId } : {}),
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(range ? { startAt: range } : {}),
    },
    include: {
      category: true,
      _count: { select: { enrollments: true } },
      exams: { include: { results: { select: { attended: true, resultStatus: true } } } },
    },
  });

  const map = new Map<
    string,
    { field: string; group: string; trainings: number; participants: number; completed: number; attended: number; passed: number }
  >();
  for (const t of trainings) {
    const key = t.category.name;
    const cur =
      map.get(key) ?? { field: key, group: t.category.groupName, trainings: 0, participants: 0, completed: 0, attended: 0, passed: 0 };
    cur.trainings += 1;
    cur.participants += t._count.enrollments;
    if (t.status === "COMPLETED") cur.completed += 1;
    for (const ex of t.exams)
      for (const r of ex.results) {
        if (r.attended === "ATTENDED") {
          cur.attended += 1;
          if (r.resultStatus === "PASSED") cur.passed += 1;
        }
      }
    map.set(key, cur);
  }
  return [...map.values()]
    .map((v) => ({
      field: v.field,
      group: v.group,
      trainings: v.trainings,
      participants: v.participants,
      completed: v.completed,
      passRate: v.attended > 0 ? Math.round((v.passed / v.attended) * 100) : 0,
    }))
    .sort((a, b) => b.trainings - a.trainings);
}

/** İl bazlı analiz */
export async function getCityAnalysis(filters: AnalyticsFilters = {}) {
  const range = dateRangeWhere(filters);
  const cities = await prisma.city.findMany({
    where: {
      ...(filters.regionId ? { regionId: filters.regionId } : {}),
      ...(filters.cityId ? { id: filters.cityId } : {}),
    },
    include: {
      region: true,
      _count: { select: { volunteers: true, instructors: true } },
      trainings: {
        where: { ...(filters.categoryId ? { categoryId: filters.categoryId } : {}), ...(range ? { startAt: range } : {}) },
        include: { exams: { include: { results: { select: { attended: true, resultStatus: true } } } } },
      },
      volunteers: { select: { status: true } },
    },
  });

  return cities
    .map((c) => {
      let attended = 0;
      let passed = 0;
      for (const t of c.trainings)
        for (const ex of t.exams)
          for (const r of ex.results) {
            if (r.attended === "ATTENDED") {
              attended += 1;
              if (r.resultStatus === "PASSED") passed += 1;
            }
          }
      return {
        city: c.name,
        region: c.region.name,
        volunteers: c._count.volunteers,
        activeVolunteers: c.volunteers.filter((v) => v.status === "ACTIVE").length,
        instructors: c._count.instructors,
        trainings: c.trainings.length,
        passRate: attended > 0 ? Math.round((passed / attended) * 100) : 0,
      };
    })
    .filter((c) => c.volunteers > 0 || c.trainings > 0 || c.instructors > 0)
    .sort((a, b) => b.volunteers - a.volunteers);
}

/** Tüm eğitim bilgileri (detaylı liste) */
export async function getAllTrainings(filters: AnalyticsFilters = {}) {
  const range = dateRangeWhere(filters);
  const trainings = await prisma.training.findMany({
    where: {
      ...(filters.regionId ? { regionId: filters.regionId } : {}),
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(range ? { startAt: range } : {}),
    },
    include: {
      category: true,
      city: true,
      primaryInstructor: true,
      _count: { select: { enrollments: true, exams: true } },
    },
    orderBy: { startAt: "desc" },
  });
  return trainings.map((t) => ({
    code: t.trainingCode,
    name: t.name,
    field: t.category.name,
    city: t.city.name,
    location: t.location,
    startAt: t.startAt,
    endAt: t.endAt,
    capacity: t.capacity,
    enrolled: t._count.enrollments,
    exams: t._count.exams,
    instructor: t.primaryInstructor ? `${t.primaryInstructor.firstName} ${t.primaryInstructor.lastName}` : "-",
    status: t.status,
  }));
}

/** Aylara göre eğitim sayısı (grafik) */
export async function getMonthlyTrainingSeries() {
  const trainings = await prisma.training.findMany({ select: { startAt: true } });
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const counts = new Array(12).fill(0);
  for (const t of trainings) {
    counts[t.startAt.getMonth()]++;
  }
  return months.map((m, i) => ({ month: m, count: counts[i] }));
}

/** İleriye dönük öngörüler (kurallı) */
export async function getPredictions() {
  const now = new Date();
  const predictions: { title: string; detail: string; level: "info" | "warning" | "danger" }[] = [];

  // Gönüllü büyüme tahmini (son 6 ay)
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const [total, recent] = await Promise.all([
    prisma.volunteerProfile.count(),
    prisma.volunteerProfile.count({ where: { createdAt: { gte: sixMonthsAgo } } }),
  ]);
  if (recent > 0) {
    const projectedYearEnd = total + recent * 2;
    predictions.push({
      title: "Yıl Sonu Gönüllü Tahmini",
      detail: `Son 6 ayda ${recent} yeni kayıt. Bu hız sürerse yıl sonunda ~${projectedYearEnd} gönüllü beklenir.`,
      level: "info",
    });
  } else {
    predictions.push({
      title: "Yıl Sonu Gönüllü Tahmini",
      detail: "Son 6 ayda yeni kayıt verisi yok. Yeterli veri yok.",
      level: "info",
    });
  }

  // Eğitmen belgeleri 60 gün içinde dolacak
  const soon = new Date(now);
  soon.setDate(now.getDate() + 60);
  const expiringInstr = await prisma.instructorCertificate.count({
    where: { expiryDate: { gte: now, lte: soon } },
  });
  predictions.push({
    title: "Süresi Dolacak Eğitmen Belgeleri",
    detail:
      expiringInstr > 0
        ? `Önümüzdeki 60 gün içinde ${expiringInstr} eğitmen belgesinin süresi dolacak.`
        : "Önümüzdeki 60 gün içinde süresi dolacak eğitmen belgesi yok.",
    level: expiringInstr > 0 ? "warning" : "info",
  });

  // Kontenjanı hızla dolan eğitimler
  const trainings = await prisma.training.findMany({
    where: { status: "PLANNED", startAt: { gte: now } },
    include: { _count: { select: { enrollments: true } } },
  });
  const filling = trainings.filter((t) => t._count.enrollments / t.capacity >= 0.8);
  predictions.push({
    title: "Kontenjanı Dolmak Üzere Olan Eğitimler",
    detail:
      filling.length > 0
        ? `${filling.length} planlı eğitimin kontenjanı %80'in üzerinde dolmuş durumda.`
        : "Kontenjanı kritik seviyede dolan planlı eğitim yok.",
    level: filling.length > 0 ? "warning" : "info",
  });

  // Eğitmen açığı olabilecek bölgeler (gönüllü/eğitmen oranı yüksek)
  const regions = await prisma.region.findMany({
    include: { _count: { select: { volunteers: true, instructors: true } } },
  });
  const shortage = regions
    .filter((r) => r._count.instructors > 0 && r._count.volunteers / r._count.instructors > 15)
    .sort((a, b) => b._count.volunteers / b._count.instructors - a._count.volunteers / a._count.instructors);
  if (shortage.length > 0) {
    predictions.push({
      title: "Eğitmen Açığı Riski",
      detail: `${shortage
        .slice(0, 3)
        .map((r) => `${r.name} (${r._count.volunteers}/${r._count.instructors})`)
        .join(", ")} bölgelerinde gönüllü/eğitmen oranı yüksek.`,
      level: "danger",
    });
  } else {
    predictions.push({
      title: "Eğitmen Açığı Riski",
      detail: "Bölgelerde belirgin eğitmen açığı tespit edilmedi.",
      level: "info",
    });
  }

  return predictions;
}
