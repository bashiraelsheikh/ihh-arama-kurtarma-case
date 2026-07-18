import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/auth";
import { ok, mapError, BusinessRuleError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiSession();
    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new BusinessRuleError("Kullanıcı bulunamadı.");
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new BusinessRuleError("Mevcut şifre hatalı.");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await writeAudit({ userId: user.id, action: "CHANGE_PASSWORD", entityType: "User", entityId: user.id });

    return ok({ changed: true });
  } catch (e) {
    return mapError(e);
  }
}
