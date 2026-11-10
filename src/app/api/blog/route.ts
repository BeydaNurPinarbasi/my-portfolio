import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth/guard";
import { createPost, deletePost, readPosts, StorageUnavailableError, toPublicPost, updatePost } from "@/lib/blog/store";
import { parseBlogInput } from "@/lib/blog/validate";

// GET (public): SADECE yayınlanmış yazılar. Taslaklar yalnızca /api/admin/blog'dan,
// geçerli admin oturumuyla okunabilir.
export async function GET() {
  try {
    const posts = (await readPosts()).filter((p) => p.published).map(toPublicPost);
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: "Blog yazıları getirilemedi" }, { status: 500 });
  }
}

function storageError(err: unknown, fallback: string) {
  if (err instanceof StorageUnavailableError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// POST: yeni yazı (admin)
export async function POST(req: Request) {
  const denied = await requireAdmin(req, { mutation: true });
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = parseBlogInput(body, "create");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  try {
    const created = await createPost({
      id: randomUUID(),
      title: input.title!,
      slug: input.slug!,
      content: input.content!,
      excerpt: input.excerpt || input.content!.slice(0, 150) + "...",
      published: input.published ?? false,
    });
    if (!created) return NextResponse.json({ error: "Bu slug zaten kullanılıyor." }, { status: 409 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return storageError(err, "Blog yazısı eklenemedi");
  }
}

// PUT: güncelle (admin)
export async function PUT(req: Request) {
  const denied = await requireAdmin(req, { mutation: true });
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  const parsed = parseBlogInput(body, "update");
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  try {
    const outcome = await updatePost(id, input);
    if (outcome === "notfound") return NextResponse.json({ error: "Blog yazısı bulunamadı" }, { status: 404 });
    if (outcome === "conflict") return NextResponse.json({ error: "Bu slug zaten kullanılıyor." }, { status: 409 });
    return NextResponse.json(outcome);
  } catch (err) {
    return storageError(err, "Blog yazısı güncellenemedi");
  }
}

// DELETE: sil (admin)
export async function DELETE(req: Request) {
  const denied = await requireAdmin(req, { mutation: true });
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli" }, { status: 400 });

  try {
    const removed = await deletePost(id);
    if (!removed) return NextResponse.json({ error: "Blog yazısı bulunamadı" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return storageError(err, "Blog yazısı silinemedi");
  }
}
