import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifre gereklidir."),
});

const phoneRegex = /^(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
const nationalIdRegex = /^[1-9]\d{10}$/;

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
    nationalIdentityNumber: z
      .string()
      .regex(nationalIdRegex, "Kimlik numarası 11 haneli olmalı ve 0 ile başlamamalıdır."),
    email: z.string().email("Geçerli bir e-posta adresi girin."),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir."),
    passwordConfirm: z.string(),
    phone: z.string().regex(phoneRegex, "Geçerli bir telefon numarası girin (örn. 0555 123 45 67)."),
    cityId: z.string().min(1, "İl seçiniz."),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Açık rıza ve kullanım koşullarını onaylamalısınız." }),
    }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Şifreler eşleşmiyor.",
    path: ["passwordConfirm"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir."),
    newPassword: z
      .string()
      .min(8, "Yeni şifre en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir."),
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    message: "Yeni şifreler eşleşmiyor.",
    path: ["newPasswordConfirm"],
  });

export const enrollSchema = z.object({
  trainingId: z.string().min(1),
});

export const phoneUpdateSchema = z.object({
  phone: z.string().regex(phoneRegex, "Geçerli bir telefon numarası girin."),
});

export const operationResponseSchema = z.object({
  assignmentId: z.string().min(1),
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

export const attendanceRecordSchema = z.object({
  volunteerId: z.string().min(1),
  status: z.enum(["PRESENT", "LATE", "LEFT_EARLY", "ABSENT", "EXCUSED"]),
  attendancePercentage: z.number().int().min(0).max(100).nullable().optional(),
  note: z.string().max(500).optional().nullable(),
});

export const attendanceSubmitSchema = z.object({
  trainingId: z.string().min(1),
  sessionDate: z.string().min(1),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  records: z.array(attendanceRecordSchema).min(1, "En az bir katılımcı kaydı gereklidir."),
});

export const examResultRecordSchema = z.object({
  volunteerId: z.string().min(1),
  attended: z.boolean(),
  score: z.number().int().min(0).nullable().optional(),
  note: z.string().max(500).optional().nullable(),
});

export const examResultSubmitSchema = z.object({
  examId: z.string().min(1),
  results: z.array(examResultRecordSchema).min(1),
});

export const createTrainingSchema = z.object({
  name: z.string().min(3, "Eğitim adı gereklidir."),
  categoryId: z.string().min(1, "Kategori seçiniz."),
  scope: z.string().min(1),
  cityId: z.string().min(1, "İl seçiniz."),
  location: z.string().min(2, "Konum gereklidir."),
  startAt: z.string().min(1, "Başlangıç tarihi gereklidir."),
  endAt: z.string().min(1, "Bitiş tarihi gereklidir."),
  capacity: z.number().int().min(1, "Kontenjan en az 1 olmalıdır."),
  instructorId: z.string().min(1, "Eğitmen seçiniz."),
  description: z.string().optional().nullable(),
});

export const createExamSchema = z.object({
  trainingId: z.string().min(1, "Eğitim seçiniz."),
  name: z.string().min(3, "Sınav adı gereklidir."),
  examType: z.string().min(1),
  examDate: z.string().min(1, "Sınav tarihi gereklidir."),
  location: z.string().min(2, "Sınav yeri gereklidir."),
  maxScore: z.number().int().min(1),
  passingScore: z.number().int().min(0),
  content: z.string().optional().nullable(),
  scope: z.string().optional().nullable(),
  learningObjectives: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  questionCount: z.number().int().min(0).optional().nullable(),
  durationMinutes: z.number().int().min(0).optional().nullable(),
  responsibleInstructorId: z.string().min(1, "Eğitmen seçiniz."),
  assignmentNote: z.string().optional().nullable(),
});
