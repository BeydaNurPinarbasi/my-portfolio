// Next.js 16 `proxy` (eski adıyla middleware). /admin sayfalarını SUNUCUDA korur:
// geçerli imzalı oturum cookie'si yoksa sayfa render edilmeden /admin/login'e yönlenir.
//
// Bu yalnızca sayfa kapısıdır. Asıl veri koruması API'dedir: her admin/mutasyon
// endpoint'i kendi içinde requireAdmin() çağırır (proxy atlanabilir varsayımıyla).

import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  if (await verifySessionToken(token)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
