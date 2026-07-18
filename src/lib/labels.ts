import type { CertStatus, PhoneFreshness } from "./business";

type Tone = "green" | "yellow" | "red" | "blue" | "gray";

export const certStatusLabel: Record<CertStatus, { label: string; tone: Tone }> = {
  VALID: { label: "Geçerli", tone: "green" },
  EXPIRING_SOON: { label: "60 gün içinde sona erecek", tone: "yellow" },
  EXPIRED: { label: "Süresi dolmuş", tone: "red" },
};

export const phoneStatusLabel: Record<PhoneFreshness, { label: string; tone: Tone }> = {
  CURRENT: { label: "Güncel", tone: "green" },
  CHECK: { label: "Kontrol edilmeli", tone: "yellow" },
  OUTDATED: { label: "Güncellenmesi gerekiyor", tone: "red" },
};

export const trainingStatusLabel: Record<string, { label: string; tone: Tone }> = {
  PLANNED: { label: "Planlandı", tone: "blue" },
  ONGOING: { label: "Devam Ediyor", tone: "yellow" },
  COMPLETED: { label: "Tamamlandı", tone: "green" },
  CANCELLED: { label: "İptal", tone: "red" },
};

export const completionStatusLabel: Record<string, { label: string; tone: Tone }> = {
  NOT_COMPLETED: { label: "Tamamlanmadı", tone: "gray" },
  COMPLETED: { label: "Tamamlandı", tone: "green" },
  FAILED: { label: "Başarısız", tone: "red" },
};

export const examResultLabel: Record<string, { label: string; tone: Tone }> = {
  PASSED: { label: "Geçti", tone: "green" },
  FAILED: { label: "Kaldı", tone: "red" },
  NOT_EVALUATED: { label: "Değerlendirilmedi", tone: "gray" },
};

export const attendanceStatusLabel: Record<string, { label: string; tone: Tone }> = {
  PRESENT: { label: "Katıldı", tone: "green" },
  LATE: { label: "Geç geldi", tone: "yellow" },
  LEFT_EARLY: { label: "Erken ayrıldı", tone: "yellow" },
  ABSENT: { label: "Katılmadı", tone: "red" },
  EXCUSED: { label: "Mazeretli", tone: "gray" },
};

export const operationStatusLabel: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Aktif", tone: "green" },
  COMPLETED: { label: "Tamamlandı", tone: "gray" },
  CANCELLED: { label: "İptal", tone: "red" },
};
