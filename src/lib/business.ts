// Merkezi iş kuralları

import { daysBetween } from "./datetime";
import { catalogByGroup, CATALOG_GROUPS, type CatalogEntry } from "./catalog";

export type PhoneFreshness = "CURRENT" | "CHECK" | "OUTDATED";

export function phoneFreshness(phoneUpdatedAt: Date, now = new Date()): PhoneFreshness {
  const diff = daysBetween(phoneUpdatedAt, now);
  if (diff <= 180) return "CURRENT";
  if (diff <= 365) return "CHECK";
  return "OUTDATED";
}

export const PHONE_FRESHNESS_LABEL: Record<PhoneFreshness, string> = {
  CURRENT: "Güncel",
  CHECK: "Kontrol edilmeli",
  OUTDATED: "Güncellenmesi gerekiyor",
};

export type CertStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export function certificateStatus(expiryDate: Date, now = new Date()): CertStatus {
  const diff = daysBetween(now, expiryDate);
  if (diff < 0) return "EXPIRED";
  if (diff <= 60) return "EXPIRING_SOON";
  return "VALID";
}

export const CERT_STATUS_LABEL: Record<CertStatus, string> = {
  VALID: "Geçerli",
  EXPIRING_SOON: "60 gün içinde sona erecek",
  EXPIRED: "Süresi dolmuş",
};

/**
 * Bir grup için seviye bağımlılığına göre tamamlanmış en yüksek seviyeyi
 * ve bir sonraki önerilen eğitimi hesaplar.
 * Seviye 2 alınmadan Seviye 3 "tamamlanmış" kabul edilmez.
 */
export function highestCompletedLevel(completedNames: Set<string>, group: string): number {
  const entries = catalogByGroup(group)
    .filter((c) => c.level != null)
    .sort((a, b) => (a.level! - b.level!));
  let highest = 0;
  for (const entry of entries) {
    if (completedNames.has(entry.name)) {
      highest = entry.level!;
    } else {
      break; // zincir kırıldı
    }
  }
  return highest;
}

export function nextRecommendedInGroup(
  completedNames: Set<string>,
  group: string,
): CatalogEntry | null {
  const entries = catalogByGroup(group)
    .filter((c) => c.level != null)
    .sort((a, b) => (a.level! - b.level!));
  const highest = highestCompletedLevel(completedNames, group);
  return entries.find((e) => e.level === highest + 1) ?? null;
}

export interface GroupProgress {
  group: string;
  completed: number;
  total: number;
  percentage: number;
}

export function computeGroupProgress(completedNames: Set<string>): GroupProgress[] {
  return CATALOG_GROUPS.map((group) => {
    const entries = catalogByGroup(group);
    const total = entries.length;
    let completed: number;
    if (group === "Temel Eğitimler") {
      completed = entries.filter((e) => completedNames.has(e.name)).length;
    } else {
      // Seviyeli gruplarda tamamlanan = zincir halinde en yüksek seviye
      completed = highestCompletedLevel(completedNames, group);
    }
    return {
      group,
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}

/** Katılım durumu -> yüzde eşlemesi (varsayılan) */
export function attendanceStatusToPercentage(status: string): number {
  switch (status) {
    case "PRESENT":
      return 100;
    case "LATE":
      return 85;
    case "LEFT_EARLY":
      return 70;
    case "EXCUSED":
      return 0;
    case "ABSENT":
    default:
      return 0;
  }
}
