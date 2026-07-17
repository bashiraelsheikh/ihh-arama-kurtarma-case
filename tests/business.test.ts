import { describe, it, expect } from "vitest";
import {
  phoneFreshness,
  certificateStatus,
  highestCompletedLevel,
  nextRecommendedInGroup,
  computeGroupProgress,
  attendanceStatusToPercentage,
} from "@/lib/business";

const NOW = new Date("2026-07-17T00:00:00Z");

describe("phoneFreshness", () => {
  it("0-180 gün -> Güncel (CURRENT)", () => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - 30);
    expect(phoneFreshness(d, NOW)).toBe("CURRENT");
  });
  it("181-365 gün -> Kontrol (CHECK)", () => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - 200);
    expect(phoneFreshness(d, NOW)).toBe("CHECK");
  });
  it("365+ gün -> Güncellenmeli (OUTDATED)", () => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - 400);
    expect(phoneFreshness(d, NOW)).toBe("OUTDATED");
  });
});

describe("certificateStatus", () => {
  it("60 günden fazla -> Geçerli (VALID)", () => {
    const d = new Date(NOW);
    d.setDate(d.getDate() + 120);
    expect(certificateStatus(d, NOW)).toBe("VALID");
  });
  it("60 gün içinde -> EXPIRING_SOON", () => {
    const d = new Date(NOW);
    d.setDate(d.getDate() + 30);
    expect(certificateStatus(d, NOW)).toBe("EXPIRING_SOON");
  });
  it("geçmiş tarih -> EXPIRED", () => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - 5);
    expect(certificateStatus(d, NOW)).toBe("EXPIRED");
  });
});

describe("seviye bağımlılığı", () => {
  it("Seviye 2 alınmadan Seviye 3 tamamlanmış sayılmaz", () => {
    const completed = new Set([
      "Kentsel Arama Kurtarma Seviye 1 Eğitimi",
      "Kentsel Arama Kurtarma Seviye 3 Eğitimi", // zincir kırık
    ]);
    expect(highestCompletedLevel(completed, "Kentsel Arama Kurtarma")).toBe(1);
  });
  it("zincir halinde en yüksek seviye doğru hesaplanır", () => {
    const completed = new Set([
      "Su Arama Kurtarma Seviye 1 Eğitimi",
      "Su Arama Kurtarma Seviye 2 Eğitimi",
      "Su Arama Kurtarma Seviye 3 Eğitimi",
    ]);
    expect(highestCompletedLevel(completed, "Su Arama Kurtarma")).toBe(3);
  });
  it("bir sonraki önerilen eğitim doğru hesaplanır", () => {
    const completed = new Set(["Doğada Arama Kurtarma Seviye 1 Eğitimi"]);
    const next = nextRecommendedInGroup(completed, "Doğada Arama Kurtarma");
    expect(next?.name).toBe("Doğada Arama Kurtarma Seviye 2 Eğitimi");
  });
});

describe("grup ilerlemesi", () => {
  it("seviyeli grupta tamamlanan = zincirdeki en yüksek seviye", () => {
    const completed = new Set([
      "Kentsel Arama Kurtarma Seviye 1 Eğitimi",
      "Kentsel Arama Kurtarma Seviye 2 Eğitimi",
    ]);
    const progress = computeGroupProgress(completed);
    const kentsel = progress.find((p) => p.group === "Kentsel Arama Kurtarma")!;
    expect(kentsel.completed).toBe(2);
    expect(kentsel.total).toBe(5);
    expect(kentsel.percentage).toBe(40);
  });
});

describe("katılım yüzdesi", () => {
  it("Katıldı -> 100, Katılmadı -> 0", () => {
    expect(attendanceStatusToPercentage("PRESENT")).toBe(100);
    expect(attendanceStatusToPercentage("ABSENT")).toBe(0);
  });
});
