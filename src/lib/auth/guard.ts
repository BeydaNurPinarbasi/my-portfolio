// Route Handler'lar için sunucu tarafı yetki kontrolü.
// Kullanım:  const denied = await requireAdmin(req); if (denied) return denied;
//
// İmza bilerek sabit tutuldu: ileride oturum kaynağı Supabase Auth olursa
// sadece bu dosyanın içi değişir, çağıran endpoint'ler aynı kalır.

import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/http/origin";
import { getAdminConfig, sessionCookieName } from "./config";
import { verifySessionToken } from "./session";

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return undefined;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const token = readCookie(req, sessionCookieName());
  return (await verifySessionToken(token)) !== null;
}

// Cookie SameSite=Strict zaten CSRF'yi büyük oranda keser; Origin kontrolü
// ikinci katman. Tarayıcılar mutasyon isteklerinde Origin gönderir; yoksa reddet.
// Ters proxy arkasında doğru çalışması için kaynak SITE_URL ile tanımlanır (bkz. lib/http/origin.ts).
const hasSameOrigin = isSameOrigin;

const NO_STORE = { "Cache-Control": "no-store" };

export async function requireAdmin(
  req: Request,
  opts: { mutation?: boolean } = {}
): Promise<NextResponse | null> {
  if (!getAdminConfig()) {
    return NextResponse.json(
      { error: "Admin kimlik doğrulaması yapılandırılmadı." },
      { status: 503, headers: NO_STORE }
    );
  }
  if (!(await isAdminRequest(req))) {
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 401, headers: NO_STORE }
    );
  }
  if (opts.mutation && !hasSameOrigin(req)) {
    return NextResponse.json(
      { error: "Geçersiz istek kaynağı." },
      { status: 403, headers: NO_STORE }
    );
  }
  return null;
}
