import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSession, type SessionPayload } from "./session";

export class AuthorizationError extends Error {
  constructor(message = "Bu işlem için yetkiniz yok.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Sunucu bileşenleri için: oturum yoksa login'e yönlendirir */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Belirli role sahip olmayı zorunlu kılar; değilse kendi paneline yönlendirir */
export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role) {
    redirect(dashboardPathForRole(session.role));
  }
  return session;
}

/** API route'ları için: yetki yoksa hata fırlatır (yönlendirme yapmaz) */
export async function requireApiRole(role: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Oturum bulunamadı.");
  if (session.role !== role) throw new AuthorizationError();
  return session;
}

export async function requireApiSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthorizationError("Oturum bulunamadı.");
  return session;
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "VOLUNTEER":
      return "/volunteer";
    case "INSTRUCTOR":
      return "/instructor";
    case "COORDINATOR":
      return "/coordinator";
    default:
      return "/login";
  }
}
