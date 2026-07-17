"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { dashboardPathForRole } from "@/lib/auth";
import type { Role } from "@prisma/client";

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function profileNameAndId(userId: string, role: Role): Promise<{ name: string; profileId: string }> {
  if (role === "VOLUNTEER") {
    const p = await prisma.volunteerProfile.findUnique({ where: { userId } });
    return { name: p ? `${p.firstName} ${p.lastName}` : "", profileId: p?.id ?? "" };
  }
  if (role === "INSTRUCTOR") {
    const p = await prisma.instructorProfile.findUnique({ where: { userId } });
    return { name: p ? `${p.firstName} ${p.lastName}` : "", profileId: p?.id ?? "" };
  }
  const p = await prisma.coordinatorProfile.findUnique({ where: { userId } });
  return { name: p ? `${p.firstName} ${p.lastName}` : "", profileId: p?.id ?? "" };
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "E-posta ve şifre gereklidir." };
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return { error: "E-posta veya şifre hatalı." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "E-posta veya şifre hatalı." };
  }
  if (user.status !== "ACTIVE") {
    return { error: "Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin." };
  }
  const { name, profileId } = await profileNameAndId(user.id, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });
  await setSessionCookie({ userId: user.id, email: user.email, role: user.role, name, profileId });
  redirect(dashboardPathForRole(user.role));
}

function nextVolunteerCode(maxCode: string | null): string {
  const n = maxCode ? parseInt(maxCode.replace(/\D/g, ""), 10) : 0;
  return `GNL-${String(n + 1).padStart(4, "0")}`;
}

export async function registerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    nationalIdentityNumber: formData.get("nationalIdentityNumber"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    phone: formData.get("phone"),
    cityId: formData.get("cityId"),
    consent: formData.get("consent") === "on" ? true : false,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as string] = issue.message;
    }
    return { error: "Lütfen formu kontrol edin.", fieldErrors };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { error: "Bu e-posta adresi zaten kayıtlı.", fieldErrors: { email: "Bu e-posta adresi zaten kayıtlı." } };
  }
  const existingId = await prisma.volunteerProfile.findUnique({
    where: { nationalIdentityNumber: data.nationalIdentityNumber },
  });
  if (existingId) {
    return {
      error: "Bu kimlik numarası zaten kayıtlı.",
      fieldErrors: { nationalIdentityNumber: "Bu kimlik numarası zaten kayıtlı." },
    };
  }
  const city = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!city) {
    return { error: "Geçersiz il seçimi.", fieldErrors: { cityId: "Geçersiz il seçimi." } };
  }

  const passwordHash = await hashPassword(data.password);

  const result = await prisma.$transaction(async (tx) => {
    const last = await tx.volunteerProfile.findFirst({
      orderBy: { volunteerCode: "desc" },
      select: { volunteerCode: true },
    });
    const volunteerCode = nextVolunteerCode(last?.volunteerCode ?? null);
    const now = new Date();
    const user = await tx.user.create({
      data: { email, passwordHash, role: "VOLUNTEER", status: "ACTIVE" },
    });
    const profile = await tx.volunteerProfile.create({
      data: {
        userId: user.id,
        volunteerCode,
        nationalIdentityNumber: data.nationalIdentityNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        phoneUpdatedAt: now, // Telefon son güncelleme = kayıt tarihi
        cityId: city.id,
        regionId: city.regionId,
        status: "ACTIVE",
      },
    });
    await writeAudit(
      {
        userId: user.id,
        action: "REGISTER_VOLUNTEER",
        entityType: "VolunteerProfile",
        entityId: profile.id,
        newData: { volunteerCode, email },
      },
      tx,
    );
    return { user, profile };
  });

  await setSessionCookie({
    userId: result.user.id,
    email: result.user.email,
    role: "VOLUNTEER",
    name: `${result.profile.firstName} ${result.profile.lastName}`,
    profileId: result.profile.id,
  });
  redirect("/volunteer");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await writeAudit({ userId: session.userId, action: "LOGOUT", entityType: "User", entityId: session.userId });
  }
  await clearSessionCookie();
  redirect("/login");
}
