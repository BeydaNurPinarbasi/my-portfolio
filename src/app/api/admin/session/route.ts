import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/guard";

// İstemcinin "oturum açık mı" sorusunu sunucudan öğrenmesi için.
// İstemcide saklanan hiçbir bayrağa güvenilmez.
export async function GET(req: Request) {
  const authenticated = await isAdminRequest(req);
  return NextResponse.json({ authenticated }, { headers: { "Cache-Control": "no-store" } });
}
