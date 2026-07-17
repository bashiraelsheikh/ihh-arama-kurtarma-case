/**
 * Excel/CSV veri setini ilişkileri koruyarak veritabanına aktarır.
 * - Kodlar (GNL-, EGT-, MES-, EĞT-, SNV- ...) benzersiz anahtar olarak kullanılır (idempotent).
 * - Şifreler hash'lenerek saklanır.
 * - Eksik foreign key durumları raporlanır (sessizce başarısız olmaz).
 */
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { parseTrDate } from "../src/lib/datetime";
import { certificateStatus } from "../src/lib/business";
import { FULL_CATALOG } from "../src/lib/catalog";
import { TURKEY_CITIES, TURKEY_REGIONS } from "../src/lib/turkey-cities";
import { readSections, findSection } from "./csv-utils";
import type {
  AccountStatus,
  TrainingStatus,
  CompletionStatus,
  CertificateStatus,
  ExamAttendanceStatus,
  ExamResultStatus,
} from "@prisma/client";

const REFERENCE_DATE = new Date(Date.UTC(2026, 6, 17)); // 17.07.2026 referans tarihi
const DATA_FILE =
  process.env.CSV_FILE ?? path.join(process.cwd(), "data", "veri_seti.csv");

const warnings: string[] = [];
function warn(msg: string) {
  warnings.push(msg);
}

function mapAccountStatus(value: string): AccountStatus {
  return value.trim().toLowerCase() === "pasif" ? "PASSIVE" : "ACTIVE";
}

function mapTrainingStatus(value: string): TrainingStatus {
  const v = value.trim().toLowerCase();
  if (v.startsWith("tamam")) return "COMPLETED";
  if (v.startsWith("devam")) return "ONGOING";
  if (v.startsWith("iptal")) return "CANCELLED";
  return "PLANNED";
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function nationalId(prefix: string, code: string): string {
  const num = code.replace(/\D/g, "").slice(-9).padStart(9, "0");
  return (prefix + "0" + num).slice(0, 11).padEnd(11, "0");
}

export async function runImport() {
  console.log(`\n=== Veri aktarımı başlıyor: ${DATA_FILE} ===\n`);
  const sections = readSections(DATA_FILE);

  // ---- 1. Bölge ve İl ----
  const regionId = new Map<string, string>();
  for (const name of TURKEY_REGIONS) {
    const r = await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    regionId.set(name, r.id);
  }
  const cityId = new Map<string, string>();
  for (const c of TURKEY_CITIES) {
    const rid = regionId.get(c.region)!;
    const city = await prisma.city.upsert({
      where: { name: c.name },
      update: { latitude: c.lat, longitude: c.lng, regionId: rid },
      create: { name: c.name, regionId: rid, latitude: c.lat, longitude: c.lng },
    });
    cityId.set(c.name, city.id);
  }
  console.log(`Bölgeler: ${regionId.size}, İller: ${cityId.size}`);

  // ---- 2. Eğitim Kategorileri ----
  const categoryIdByName = new Map<string, string>();
  const categoryIdByArea = new Map<string, string>();
  for (const entry of FULL_CATALOG) {
    const cat = await prisma.trainingCategory.upsert({
      where: { name: entry.name },
      update: {
        groupName: entry.groupName,
        level: entry.level,
        passingScore: entry.passingScore,
        durationDays: entry.durationDays,
        areaCode: entry.area,
      },
      create: {
        name: entry.name,
        groupName: entry.groupName,
        level: entry.level,
        passingScore: entry.passingScore,
        durationDays: entry.durationDays,
        areaCode: entry.area,
        active: true,
      },
    });
    categoryIdByName.set(entry.name, cat.id);
    categoryIdByArea.set(entry.area, cat.id);
  }
  console.log(`Eğitim kategorileri: ${categoryIdByName.size}`);

  function resolveCategory(name?: string, area?: string): string | null {
    if (name && categoryIdByName.has(name)) return categoryIdByName.get(name)!;
    if (area && categoryIdByArea.has(area)) return categoryIdByArea.get(area)!;
    // Alan koduyla eşleşen ilk temel kategori
    if (area) {
      const entry = FULL_CATALOG.find((c) => c.area === area || c.area.startsWith(area));
      if (entry) return categoryIdByName.get(entry.name) ?? null;
    }
    return null;
  }

  // ---- 3. Sertifika Türleri (CSV'deki isimlerden) ----
  const certTypeIdByName = new Map<string, string>();
  async function ensureCertType(name: string, area: string): Promise<string> {
    if (certTypeIdByName.has(name)) return certTypeIdByName.get(name)!;
    const catId = resolveCategory(undefined, area);
    const ct = await prisma.certificateType.upsert({
      where: { name },
      update: {},
      create: { name, trainingCategoryId: catId ?? undefined, validityMonths: 36, active: true },
    });
    certTypeIdByName.set(name, ct.id);
    return ct.id;
  }

  // ---- 4. Merkez Eğitim Sorumluları ----
  const coordinatorIdByCode = new Map<string, string>();
  const coordSection = findSection(sections, "Sorumlu ID");
  if (coordSection) {
    for (const row of coordSection.rows) {
      const code = row["Sorumlu ID"];
      if (!code) continue;
      const email = row["Giriş E-postası"] || row["E-posta"];
      const { firstName, lastName } = splitName(row["Ad Soyad"]);
      const respRegion = row["Sorumlu Bölge"];
      const cityName = row["Bulunduğu İl"];
      const rid = regionId.get(respRegion);
      const cid = cityId.get(cityName);
      if (!rid) warn(`Sorumlu ${code}: bölge bulunamadı '${respRegion}'`);
      if (!cid) warn(`Sorumlu ${code}: il bulunamadı '${cityName}'`);
      if (!rid || !cid || !email) continue;
      const passwordHash = await hashPassword(row["Şifre"]);
      const user = await prisma.user.upsert({
        where: { email },
        update: { role: "COORDINATOR", status: mapAccountStatus(row["Durum"]) },
        create: { email, passwordHash, role: "COORDINATOR", status: mapAccountStatus(row["Durum"]) },
      });
      const profile = await prisma.coordinatorProfile.upsert({
        where: { coordinatorCode: code },
        update: { firstName, lastName, phone: row["Telefon"], responsibleRegionId: rid, cityId: cid },
        create: {
          userId: user.id,
          coordinatorCode: code,
          nationalIdentityNumber: nationalId("3", code),
          firstName,
          lastName,
          phone: row["Telefon"],
          responsibleRegionId: rid,
          cityId: cid,
          status: mapAccountStatus(row["Durum"]),
        },
      });
      coordinatorIdByCode.set(code, profile.id);
    }
  }
  console.log(`Merkez eğitim sorumluları: ${coordinatorIdByCode.size}`);

  // ---- 5. Eğitmenler ----
  const instructorIdByCode = new Map<string, string>();
  const instrSection = findSection(sections, "Eğitmen ID");
  if (instrSection) {
    for (const row of instrSection.rows) {
      const code = row["Eğitmen ID"];
      if (!code) continue;
      const email = row["E-posta"];
      const { firstName, lastName } = splitName(row["Ad Soyad"]);
      const cityName = row["Bulunduğu İl"];
      const cid = cityId.get(cityName);
      const rid = regionId.get(row["Bölge"]);
      if (!cid) warn(`Eğitmen ${code}: il bulunamadı '${cityName}'`);
      if (!rid) warn(`Eğitmen ${code}: bölge bulunamadı '${row["Bölge"]}'`);
      if (!cid || !rid || !email) continue;
      const passwordHash = await hashPassword(row["Şifre"]);
      const user = await prisma.user.upsert({
        where: { email },
        update: { role: "INSTRUCTOR", status: mapAccountStatus(row["Durum"]) },
        create: { email, passwordHash, role: "INSTRUCTOR", status: mapAccountStatus(row["Durum"]) },
      });
      const profile = await prisma.instructorProfile.upsert({
        where: { instructorCode: code },
        update: { firstName, lastName, phone: row["Telefon"], cityId: cid, regionId: rid },
        create: {
          userId: user.id,
          instructorCode: code,
          nationalIdentityNumber: nationalId("2", code),
          firstName,
          lastName,
          phone: row["Telefon"],
          cityId: cid,
          regionId: rid,
          status: mapAccountStatus(row["Durum"]),
        },
      });
      instructorIdByCode.set(code, profile.id);

      // Uzmanlık alanları
      const expertiseNames = (row["Uzmanlık Eğitimleri"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const trName of expertiseNames) {
        const catId = categoryIdByName.get(trName) ?? resolveCategory(trName);
        if (!catId) {
          warn(`Eğitmen ${code}: uzmanlık kategorisi bulunamadı '${trName}'`);
          continue;
        }
        await prisma.instructorExpertise.upsert({
          where: { instructorId_trainingCategoryId: { instructorId: profile.id, trainingCategoryId: catId } },
          update: {},
          create: { instructorId: profile.id, trainingCategoryId: catId, level: "Uzman" },
        });
      }
    }
  }
  console.log(`Eğitmenler: ${instructorIdByCode.size}`);

  // ---- 6. Gönüllüler ----
  const volunteerIdByCode = new Map<string, string>();
  const volSection = findSection(sections, "Gönüllü ID");
  if (volSection) {
    for (const row of volSection.rows) {
      const code = row["Gönüllü ID"];
      if (!code) continue;
      const email = row["E-posta"];
      const { firstName, lastName } = splitName(row["Ad Soyad"]);
      const cityName = row["İl"];
      const cid = cityId.get(cityName);
      const rid = regionId.get(row["Bölge"]);
      if (!cid) warn(`Gönüllü ${code}: il bulunamadı '${cityName}'`);
      if (!rid) warn(`Gönüllü ${code}: bölge bulunamadı '${row["Bölge"]}'`);
      if (!cid || !rid || !email) continue;
      const passwordHash = await hashPassword(row["Şifre"]);
      const phoneUpdatedAt = parseTrDate(row["Telefon Son Güncelleme"]) ?? REFERENCE_DATE;
      const user = await prisma.user.upsert({
        where: { email },
        update: { role: "VOLUNTEER", status: mapAccountStatus(row["Durum"]) },
        create: { email, passwordHash, role: "VOLUNTEER", status: mapAccountStatus(row["Durum"]) },
      });
      const profile = await prisma.volunteerProfile.upsert({
        where: { volunteerCode: code },
        update: { firstName, lastName, phone: row["Telefon"], phoneUpdatedAt, cityId: cid, regionId: rid },
        create: {
          userId: user.id,
          volunteerCode: code,
          nationalIdentityNumber: nationalId("1", code),
          firstName,
          lastName,
          phone: row["Telefon"],
          phoneUpdatedAt,
          cityId: cid,
          regionId: rid,
          status: mapAccountStatus(row["Durum"]),
        },
      });
      volunteerIdByCode.set(code, profile.id);
    }
  }
  console.log(`Gönüllüler: ${volunteerIdByCode.size}`);

  // ---- 7. Eğitimler ----
  const trainingIdByCode = new Map<string, string>();
  const trSection = findSection(sections, "Eğitim ID");
  if (trSection) {
    for (const row of trSection.rows) {
      const code = row["Eğitim ID"];
      if (!code) continue;
      const catId = resolveCategory(row["Eğitim Adı"], row["Alan"]);
      const cid = cityId.get(row["İl"]);
      const rid = regionId.get(row["Bölge"]);
      if (!catId) warn(`Eğitim ${code}: kategori bulunamadı '${row["Eğitim Adı"]}'`);
      if (!cid) warn(`Eğitim ${code}: il bulunamadı '${row["İl"]}'`);
      if (!rid) warn(`Eğitim ${code}: bölge bulunamadı '${row["Bölge"]}'`);
      if (!catId || !cid || !rid) continue;
      const coordId = coordinatorIdByCode.get(row["Merkez Sorumlu ID"]) ?? null;
      const instrId = instructorIdByCode.get(row["Eğitmen ID"]) ?? null;
      const startAt = parseTrDate(row["Başlangıç Tarihi"]) ?? REFERENCE_DATE;
      const endAt = parseTrDate(row["Bitiş Tarihi"]) ?? startAt;
      const training = await prisma.training.upsert({
        where: { trainingCode: code },
        update: {
          name: row["Eğitim Adı"],
          scope: row["Kapsam"],
          location: row["Konum"],
          startAt,
          endAt,
          durationDays: parseInt(row["Süre (Gün)"]) || null,
          capacity: parseInt(row["Kontenjan"]) || 20,
          status: mapTrainingStatus(row["Durum"]),
          coordinatorId: coordId,
          primaryInstructorId: instrId,
          categoryId: catId,
          cityId: cid,
          regionId: rid,
        },
        create: {
          trainingCode: code,
          categoryId: catId,
          name: row["Eğitim Adı"],
          scope: row["Kapsam"],
          cityId: cid,
          regionId: rid,
          location: row["Konum"],
          startAt,
          endAt,
          durationDays: parseInt(row["Süre (Gün)"]) || null,
          capacity: parseInt(row["Kontenjan"]) || 20,
          status: mapTrainingStatus(row["Durum"]),
          coordinatorId: coordId,
          primaryInstructorId: instrId,
        },
      });
      trainingIdByCode.set(code, training.id);
    }
  }
  console.log(`Eğitimler: ${trainingIdByCode.size}`);

  // ---- 8. Eğitim-Eğitmen atamaları ----
  const tiSection = findSection(sections, "Kayıt ID");
  let tiCount = 0;
  if (tiSection) {
    for (const row of tiSection.rows) {
      const tId = trainingIdByCode.get(row["Eğitim ID"]);
      const iId = instructorIdByCode.get(row["Eğitmen ID"]);
      if (!tId || !iId) {
        warn(`Eğitim-Eğitmen ${row["Kayıt ID"]}: eşleşme yok (${row["Eğitim ID"]}, ${row["Eğitmen ID"]})`);
        continue;
      }
      await prisma.trainingInstructor.upsert({
        where: { trainingId_instructorId: { trainingId: tId, instructorId: iId } },
        update: { role: row["Rol"] || "Eğitmen" },
        create: { trainingId: tId, instructorId: iId, role: row["Rol"] || "Eğitmen" },
      });
      tiCount++;
    }
  }
  console.log(`Eğitim-Eğitmen atamaları: ${tiCount}`);

  // ---- 9. Katılımlar (Enrollment) ----
  const enrSection = findSection(sections, "Katılım ID");
  let enrCount = 0;
  if (enrSection) {
    for (const row of enrSection.rows) {
      const tId = trainingIdByCode.get(row["Eğitim ID"]);
      const vId = volunteerIdByCode.get(row["Gönüllü ID"]);
      if (!tId || !vId) {
        warn(`Katılım ${row["Katılım ID"]}: eşleşme yok (${row["Eğitim ID"]}, ${row["Gönüllü ID"]})`);
        continue;
      }
      const pct = parseInt(row["Katılım Yüzdesi"]) || 0;
      const trStatus = mapTrainingStatus(
        trSection?.rows.find((t) => t["Eğitim ID"] === row["Eğitim ID"])?.["Durum"] ?? "",
      );
      const completion: CompletionStatus =
        trStatus === "COMPLETED" && pct >= 70 ? "COMPLETED" : "NOT_COMPLETED";
      await prisma.trainingEnrollment.upsert({
        where: { trainingId_volunteerId: { trainingId: tId, volunteerId: vId } },
        update: { attendancePercentage: pct, completionStatus: completion },
        create: {
          trainingId: tId,
          volunteerId: vId,
          enrollmentStatus: "ENROLLED",
          attendancePercentage: pct,
          completionStatus: completion,
        },
      });
      enrCount++;
    }
  }
  console.log(`Katılım kayıtları: ${enrCount}`);

  // ---- 10. Sertifikalar ----
  function mapCertStatus(expiry: Date | null): CertificateStatus {
    if (!expiry) return "VALID";
    const s = certificateStatus(expiry, REFERENCE_DATE);
    return s === "EXPIRING_SOON" ? "EXPIRING_SOON" : s === "EXPIRED" ? "EXPIRED" : "VALID";
  }
  const volCertSection = sections.filter((s) => s.header[0] === "Sertifika ID" && s.header[1] === "Gönüllü ID")[0];
  let volCertCount = 0;
  if (volCertSection) {
    for (const row of volCertSection.rows) {
      const vId = volunteerIdByCode.get(row["Gönüllü ID"]);
      const certNo = row["Sertifika ID"];
      if (!vId || !certNo) continue;
      const ctId = await ensureCertType(row["Sertifika Adı"], row["Alan"]);
      const issue = parseTrDate(row["Veriliş Tarihi"]) ?? REFERENCE_DATE;
      const expiry = parseTrDate(row["Geçerlilik Bitişi"]) ?? REFERENCE_DATE;
      await prisma.volunteerCertificate.upsert({
        where: { certificateNumber: certNo },
        update: { status: mapCertStatus(expiry), expiryDate: expiry, issueDate: issue },
        create: {
          certificateNumber: certNo,
          volunteerId: vId,
          certificateTypeId: ctId,
          area: row["Alan"],
          issueDate: issue,
          expiryDate: expiry,
          status: mapCertStatus(expiry),
        },
      });
      volCertCount++;
    }
  }
  console.log(`Gönüllü sertifikaları: ${volCertCount}`);

  const instrCertSection = sections.filter((s) => s.header[0] === "Sertifika ID" && s.header[1] === "Eğitmen ID")[0];
  let instrCertCount = 0;
  if (instrCertSection) {
    for (const row of instrCertSection.rows) {
      const iId = instructorIdByCode.get(row["Eğitmen ID"]);
      const certNo = row["Sertifika ID"];
      if (!iId || !certNo) continue;
      const ctId = await ensureCertType(row["Sertifika Adı"], row["Alan"]);
      const issue = parseTrDate(row["Veriliş Tarihi"]) ?? REFERENCE_DATE;
      const expiry = parseTrDate(row["Geçerlilik Bitişi"]) ?? REFERENCE_DATE;
      await prisma.instructorCertificate.upsert({
        where: { certificateNumber: certNo },
        update: { status: mapCertStatus(expiry), expiryDate: expiry, issueDate: issue },
        create: {
          certificateNumber: certNo,
          instructorId: iId,
          certificateTypeId: ctId,
          area: row["Alan"],
          issueDate: issue,
          expiryDate: expiry,
          status: mapCertStatus(expiry),
        },
      });
      instrCertCount++;
    }
  }
  console.log(`Eğitmen sertifikaları: ${instrCertCount}`);

  // ---- 11. Sınavlar ----
  const examIdByCode = new Map<string, string>();
  const examSection = findSection(sections, "Sınav ID");
  if (examSection) {
    for (const row of examSection.rows) {
      const code = row["Sınav ID"];
      const tId = trainingIdByCode.get(row["Eğitim ID"]);
      if (!code || !tId) {
        warn(`Sınav ${code}: eğitim bulunamadı '${row["Eğitim ID"]}'`);
        continue;
      }
      const training = trSection?.rows.find((t) => t["Eğitim ID"] === row["Eğitim ID"]);
      const coordId = training ? coordinatorIdByCode.get(training["Merkez Sorumlu ID"]) ?? null : null;
      const instrId = training ? instructorIdByCode.get(training["Eğitmen ID"]) ?? null : null;
      const cid = cityId.get(row["İl"]) ?? null;
      const exam = await prisma.exam.upsert({
        where: { examCode: code },
        update: {
          name: row["Sınav Adı"],
          examDate: parseTrDate(row["Sınav Tarihi"]) ?? REFERENCE_DATE,
          maxScore: parseInt(row["Azami Puan"]) || 100,
          passingScore: parseInt(row["Geçme Puanı"]) || 60,
          responsibleInstructorId: instrId,
          createdByCoordinatorId: coordId,
          cityId: cid,
          location: row["Konum"],
        },
        create: {
          examCode: code,
          trainingId: tId,
          name: row["Sınav Adı"],
          examType: "Yazılı",
          examDate: parseTrDate(row["Sınav Tarihi"]) ?? REFERENCE_DATE,
          cityId: cid,
          location: row["Konum"],
          maxScore: parseInt(row["Azami Puan"]) || 100,
          passingScore: parseInt(row["Geçme Puanı"]) || 60,
          responsibleInstructorId: instrId,
          createdByCoordinatorId: coordId,
          status: "COMPLETED",
        },
      });
      examIdByCode.set(code, exam.id);
    }
  }
  console.log(`Sınavlar: ${examIdByCode.size}`);

  // ---- 12. Sınav Sonuçları ----
  const resultSection = findSection(sections, "Sonuç ID");
  let resultCount = 0;
  if (resultSection) {
    for (const row of resultSection.rows) {
      const eId = examIdByCode.get(row["Sınav ID"]);
      const vId = volunteerIdByCode.get(row["Katılımcı ID"]);
      if (!eId || !vId) {
        warn(`Sonuç ${row["Sonuç ID"]}: eşleşme yok (${row["Sınav ID"]}, ${row["Katılımcı ID"]})`);
        continue;
      }
      const attendedRaw = row["Sınava Girme Durumu"].trim().toLowerCase();
      const attended: ExamAttendanceStatus = attendedRaw.startsWith("gir") && !attendedRaw.includes("me")
        ? "ATTENDED"
        : attendedRaw === "girdi"
          ? "ATTENDED"
          : "NOT_ATTENDED";
      const resultRaw = row["Sonuç"].trim().toLowerCase();
      let resultStatus: ExamResultStatus = "NOT_EVALUATED";
      if (resultRaw === "geçti") resultStatus = "PASSED";
      else if (resultRaw === "kaldı") resultStatus = "FAILED";
      const score = row["Alınan Puan"] ? parseInt(row["Alınan Puan"]) : null;
      const passed = resultStatus === "PASSED" ? true : resultStatus === "FAILED" ? false : null;
      await prisma.examResult.upsert({
        where: { examId_volunteerId: { examId: eId, volunteerId: vId } },
        update: { attended, score, passed, resultStatus },
        create: {
          examId: eId,
          volunteerId: vId,
          attended,
          score,
          passed,
          resultStatus,
        },
      });
      resultCount++;
    }
  }
  console.log(`Sınav sonuçları: ${resultCount}`);

  // ---- 13. Operasyonlar (sentetik, deterministik) ----
  const searchRescueCat = categoryIdByName.get("Depremde Arama ve Kurtarma Eğitimi") ?? null;
  const operationSeeds = [
    { name: "Marmara Deprem Tatbikatı Çağrısı", region: "Marmara", city: "İstanbul" },
    { name: "Ege Sel Müdahale Operasyonu", region: "Ege", city: "İzmir" },
    { name: "İç Anadolu Enkaz Arama Tatbikatı", region: "İç Anadolu", city: "Ankara" },
  ];
  let opCount = 0;
  for (const seed of operationSeeds) {
    const rid = regionId.get(seed.region)!;
    const cid = cityId.get(seed.city)!;
    const existing = await prisma.operation.findFirst({ where: { name: seed.name } });
    const op =
      existing ??
      (await prisma.operation.create({
        data: {
          name: seed.name,
          description: `${seed.region} bölgesi arama kurtarma gönüllüleri için aktif operasyon çağrısı.`,
          cityId: cid,
          regionId: rid,
          startAt: new Date(Date.UTC(2026, 6, 25, 6, 0)),
          status: "ACTIVE",
          requiredTrainingCategoryId: searchRescueCat ?? undefined,
        },
      }));
    // Bölgedeki ilk 8 aktif gönüllüyü davet et
    const vols = await prisma.volunteerProfile.findMany({
      where: { regionId: rid, status: "ACTIVE" },
      take: 8,
    });
    for (const v of vols) {
      await prisma.operationAssignment.upsert({
        where: { operationId_volunteerId: { operationId: op.id, volunteerId: v.id } },
        update: {},
        create: { operationId: op.id, volunteerId: v.id, invitationStatus: "INVITED" },
      });
    }
    opCount++;
  }
  console.log(`Operasyonlar: ${opCount}`);

  // ---- Rapor ----
  console.log(`\n=== Aktarım tamamlandı ===`);
  if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} uyarı:`);
    warnings.slice(0, 40).forEach((w) => console.log("  - " + w));
    if (warnings.length > 40) console.log(`  ... ve ${warnings.length - 40} uyarı daha`);
  } else {
    console.log("Uyarı yok. Tüm foreign key ilişkileri çözüldü.");
  }
}

// CLI olarak çalıştırıldığında
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runImport()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error("Aktarım hatası:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
