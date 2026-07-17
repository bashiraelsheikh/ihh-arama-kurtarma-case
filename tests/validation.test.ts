import { describe, it, expect } from "vitest";
import { registerSchema, createExamSchema } from "@/lib/validation";

const validRegister = {
  firstName: "Test",
  lastName: "Kullanıcı",
  nationalIdentityNumber: "12345678901",
  email: "test@ornek.org",
  password: "Guclu123",
  passwordConfirm: "Guclu123",
  phone: "0555 123 45 67",
  cityId: "city-1",
  consent: true,
};

describe("gönüllü kayıt doğrulaması", () => {
  it("geçerli veri kabul edilir", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });
  it("zayıf şifre reddedilir (rakam yok)", () => {
    const r = registerSchema.safeParse({ ...validRegister, password: "abcdefgh", passwordConfirm: "abcdefgh" });
    expect(r.success).toBe(false);
  });
  it("şifreler eşleşmezse reddedilir", () => {
    const r = registerSchema.safeParse({ ...validRegister, passwordConfirm: "Farkli123" });
    expect(r.success).toBe(false);
  });
  it("onay verilmezse reddedilir", () => {
    const r = registerSchema.safeParse({ ...validRegister, consent: false });
    expect(r.success).toBe(false);
  });
  it("geçersiz telefon reddedilir", () => {
    const r = registerSchema.safeParse({ ...validRegister, phone: "123" });
    expect(r.success).toBe(false);
  });
  it("geçersiz kimlik numarası reddedilir", () => {
    const r = registerSchema.safeParse({ ...validRegister, nationalIdentityNumber: "0123" });
    expect(r.success).toBe(false);
  });
});

describe("sınav oluşturma doğrulaması", () => {
  it("eksik eğitmen reddedilir", () => {
    const r = createExamSchema.safeParse({
      trainingId: "t1",
      name: "Sınav",
      examType: "Yazılı",
      examDate: "2026-01-01",
      location: "Salon",
      maxScore: 100,
      passingScore: 60,
      responsibleInstructorId: "",
    });
    expect(r.success).toBe(false);
  });
});
