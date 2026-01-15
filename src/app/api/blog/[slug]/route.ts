import { NextResponse } from "next/server";
import { readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "data");
const BLOG_FILE = path.join(BLOG_DIR, "blog.json");

async function ensureDataDir() {
  if (!existsSync(BLOG_DIR)) {
    await mkdir(BLOG_DIR, { recursive: true });
  }
}

async function getBlogPosts() {
  await ensureDataDir();
  try {
    const data = await readFile(BLOG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// GET - Slug'a göre tek blog yazısı getir
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const posts = await getBlogPosts();
    const post = posts.find(
      (p: any) => p.slug === slug && p.published
    );

    if (!post) {
      return NextResponse.json(
        { error: "Blog yazısı bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "Blog yazısı getirilemedi" },
      { status: 500 }
    );
  }
}
