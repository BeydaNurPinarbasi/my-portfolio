import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { readPosts } from "@/lib/blog/store";

// Admin listesi: taslaklar dahil TÜM yazılar. Oturum zorunlu, önbelleğe alınmaz.
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    return NextResponse.json(await readPosts(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Blog yazıları getirilemedi" }, { status: 500 });
  }
}
