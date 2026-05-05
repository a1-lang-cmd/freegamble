import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, hasAdminKeyConfigured, isValidAdminCookie } from "@/lib/adminAuth";

export function GET() {
  return NextResponse.json({
    configured: hasAdminKeyConfigured(),
    loggedIn: isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value)
  });
}
