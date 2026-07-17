import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Route handler'ları güvenli hata yönetimiyle sarar (hassas bilgi sızdırmaz) */
export function handler<T>(fn: () => Promise<NextResponse<T>>) {
  return async () => {
    try {
      return await fn();
    } catch (e) {
      return mapError(e);
    }
  };
}

export function mapError(e: unknown): NextResponse {
  if (e instanceof AuthorizationError) {
    return fail(e.message, 403);
  }
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of e.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return fail("Geçersiz veri.", 422, { fieldErrors });
  }
  if (e instanceof Error && e.message.startsWith("İş kuralı:")) {
    return fail(e.message.replace("İş kuralı: ", ""), 409);
  }
  console.error("API hatası:", e);
  return fail("Beklenmeyen bir hata oluştu.", 500);
}

/** İş kuralı ihlali için özel hata */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super("İş kuralı: " + message);
    this.name = "BusinessRuleError";
  }
}
