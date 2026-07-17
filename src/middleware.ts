import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "afad_session";

const ROLE_PREFIX: Record<string, string> = {
  VOLUNTEER: "/volunteer",
  INSTRUCTOR: "/instructor",
  COORDINATOR: "/coordinator",
};

async function verify(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedPrefixes = ["/volunteer", "/instructor", "/coordinator"];
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const payload = await verify(token);
  if (!payload?.role) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
  const allowedPrefix = ROLE_PREFIX[payload.role];
  if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(allowedPrefix, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/volunteer/:path*", "/instructor/:path*", "/coordinator/:path*"],
};
