import { NextResponse } from "next/server";
import { readPosts, toPublicPost } from "@/lib/blog/store";

// GET - Slug'a göre tek yayınlanmış blog yazısı (taslaklar 404 döner)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = (await readPosts()).find((p) => p.slug === slug && p.published);

    if (!post) {
      return NextResponse.json({ error: "Blog yazısı bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(toPublicPost(post));
  } catch {
    return NextResponse.json({ error: "Blog yazısı getirilemedi" }, { status: 500 });
  }
}
