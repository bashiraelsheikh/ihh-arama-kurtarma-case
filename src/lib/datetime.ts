import { format, toZonedTime } from "date-fns-tz";

export const TIME_ZONE = "Europe/Istanbul";

/** Türkçe tarih formatı: gg.aa.yyyy */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(toZonedTime(d, TIME_ZONE), "dd.MM.yyyy", { timeZone: TIME_ZONE });
}

/** Türkçe tarih-saat formatı: gg.aa.yyyy ss:dd */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(toZonedTime(d, TIME_ZONE), "dd.MM.yyyy HH:mm", { timeZone: TIME_ZONE });
}

/** "dd.MM.yyyy" veya "dd.MM.yyyy HH:mm" biçimindeki Türkçe tarihi Date'e çevirir */
export function parseTrDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [datePart, timePart] = trimmed.split(" ");
  const [dd, mm, yyyy] = datePart.split(".").map((v) => parseInt(v, 10));
  if (!dd || !mm || !yyyy) return null;
  let hours = 0;
  let minutes = 0;
  if (timePart) {
    const [h, m] = timePart.split(":").map((v) => parseInt(v, 10));
    hours = h || 0;
    minutes = m || 0;
  }
  // Europe/Istanbul UTC+3 (yaz saati uygulaması kaldırıldı)
  const utcMs = Date.UTC(yyyy, mm - 1, dd, hours - 3, minutes, 0);
  return new Date(utcMs);
}

/** İki tarih arasındaki gün farkı */
export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
