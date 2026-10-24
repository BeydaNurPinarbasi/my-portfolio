import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/http/origin";
import { getAdminConfig, sessionCookieName, SESSION_TTL_SECONDS } from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import { DUMMY_HASH, safeEqualStrings, verifyPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";

// node:crypto (scrypt) gerektirir.
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const GENERIC_ERROR = "E-posta veya şifre hatalı.";

export async function POST(req: Request) {
  const config = getAdminConfig();
  if (!config) {
    console.error("[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH / SESSION_SECRET eksik: giriş kapalı.");
    return NextResponse.json(
      { error: "Admin girişi şu an yapılandırılmadı." },
      { status: 503, headers: NO_STORE }
    );
  }

  // Aynı kaynaktan gelmeyen giriş denemelerini reddet (login CSRF).
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403, headers: NO_STORE });
  }

  const limit = rateLimit(`login:${clientIp(req)}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfter) } }
    );
  }

  let email = "";
  let password = "";
  try {
    const body = await req.json();
    if (typeof body?.email === "string") email = body.email.trim().toLowerCase();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    // geçersiz JSON -> aşağıda genel hata
  }
  if (!email || !password || email.length > 254 || password.length > 256) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401, headers: NO_STORE });
  }

  // E-posta yanlış olsa da scrypt çalıştır: zamanlama farkı bilgi sızdırmasın.
  const emailOk = safeEqualStrings(email, config.email);
  const passwordOk = await verifyPassword(password, emailOk ? config.passwordHash : DUMMY_HASH);
  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401, headers: NO_STORE });
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Oturum oluşturulamadı." }, { status: 500, headers: NO_STORE });
  }

  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
