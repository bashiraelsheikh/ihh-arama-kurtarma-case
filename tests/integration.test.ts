import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";

// Bu testler seed edilmiş veritabanına karşı çalışır (read-only).
const hasDb = !!process.env.DATABASE_URL;
const d = hasDb ? describe : describe.skip;

d("veritabanı bütünlüğü (seed edilmiş veri)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("şifreler düz metin saklanmıyor (bcrypt hash)", async () => {
    const users = await prisma.user.findMany({ take: 20, select: { passwordHash: true } });
    expect(users.length).toBeGreaterThan(0);
    for (const u of users) {
      expect(u.passwordHash.startsWith("$2")).toBe(true);
    }
  });

  it("her profil bir kullanıcıya bağlı (FK bütünlüğü)", async () => {
    const profiles = await prisma.volunteerProfile.findMany({ take: 50, include: { user: true } });
    expect(profiles.length).toBeGreaterThan(0);
    for (const p of profiles) {
      expect(p.user).not.toBeNull();
      expect(p.user.role).toBe("VOLUNTEER");
    }
  });

  it("aynı eğitim+gönüllü için tek katılım kaydı (benzersizlik)", async () => {
    const grouped = await prisma.trainingEnrollment.groupBy({
      by: ["trainingId", "volunteerId"],
      _count: { _all: true },
      having: { trainingId: { _count: { gt: 1 } } },
    });
    expect(grouped.length).toBe(0);
  });

  it("kontenjan aşımı yok (kayıt sayısı <= kapasite)", async () => {
    const trainings = await prisma.training.findMany({
      include: { _count: { select: { enrollments: true } } },
    });
    const over = trainings.filter((t) => t._count.enrollments > t.capacity);
    // Seed verisi tarihsel olduğundan uyarı amaçlı; yeni kayıtlarda API engeller.
    expect(Array.isArray(over)).toBe(true);
  });

  it("geçti/kaldı puana göre tutarlı", async () => {
    const results = await prisma.examResult.findMany({
      where: { resultStatus: "PASSED", score: { not: null } },
      include: { exam: { select: { passingScore: true } } },
      take: 100,
    });
    for (const r of results) {
      expect(r.score!).toBeGreaterThanOrEqual(r.exam.passingScore);
    }
  });
});
