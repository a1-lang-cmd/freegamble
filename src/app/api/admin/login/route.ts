import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminCookieValue, hasAdminKeyConfigured, sessionMaxAgeSeconds, validateAdminKey } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { key?: string } | null;
  const key = body?.key ?? "";

  if (!hasAdminKeyConfigured()) {
    return NextResponse.json({ ok: false, message: "Admin key is not configured on the server." }, { status: 500 });
  }

  if (!validateAdminKey(key)) {
    return NextResponse.json({ ok: false, message: "Invalid admin key." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminCookieValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/"
  });
  return response;
}
