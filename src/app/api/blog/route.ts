import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "data");
const BLOG_FILE = path.join(BLOG_DIR, "blog.json");

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(BLOG_DIR)) {
    await mkdir(BLOG_DIR, { recursive: true });
  }
  if (!existsSync(BLOG_FILE)) {
    await writeFile(BLOG_FILE, JSON.stringify([], null, 2), "utf-8");
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

async function saveBlogPosts(posts: any[]) {
  await ensureDataDir();
  await writeFile(BLOG_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

// GET - Tüm blog yazılarını getir
export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: "Blog yazıları getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni blog yazısı ekle
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, excerpt, slug, published } = body;

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: "Başlık, içerik ve slug zorunludur" },
        { status: 400 }
      );
    }

    const posts = await getBlogPosts();
    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + "...",
      slug,
      published: published ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    posts.push(newPost);
    await saveBlogPosts(posts);

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Blog yazısı eklenemedi" },
      { status: 500 }
    );
  }
}

// PUT - Blog yazısı güncelle
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, content, excerpt, slug, published } = body;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const posts = await getBlogPosts();
    const index = posts.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Blog yazısı bulunamadı" },
        { status: 404 }
      );
    }

    posts[index] = {
      ...posts[index],
      title: title || posts[index].title,
      content: content || posts[index].content,
      excerpt: excerpt || posts[index].excerpt,
      slug: slug || posts[index].slug,
      published: published !== undefined ? published : posts[index].published,
      updatedAt: new Date().toISOString(),
    };

    await saveBlogPosts(posts);
    return NextResponse.json(posts[index]);
  } catch (error) {
    return NextResponse.json(
      { error: "Blog yazısı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Blog yazısı sil
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const posts = await getBlogPosts();
    const filtered = posts.filter((p: any) => p.id !== id);

    await saveBlogPosts(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Blog yazısı silinemedi" },
      { status: 500 }
    );
  }
}
