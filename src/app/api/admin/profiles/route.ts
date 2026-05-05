import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/adminAuth";

const getSupabaseAdminConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceKey ? { url, serviceKey } : null;
};

export async function GET() {
  if (!isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, message: "Admin session required." }, { status: 401 });
  }

  const config = getSupabaseAdminConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, message: "Supabase admin key is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel." },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${config.url}/rest/v1/profiles?select=id,email,username,coins,updated_at&order=coins.desc&limit=200`,
    {
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`
      },
      cache: "no-store"
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ ok: false, message: "Could not load accounts.", detail: data }, { status: response.status });
  }

  return NextResponse.json({ ok: true, profiles: data });
}
