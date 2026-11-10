import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { listMessages } from "@/lib/db/messages";

// İletişim formundan gelen mesajlar. Oturum zorunlu, önbelleğe alınmaz.
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await listMessages(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[messages] listelenemedi:", err);
    return NextResponse.json({ error: "Mesajlar getirilemedi." }, { status: 503 });
  }
}
