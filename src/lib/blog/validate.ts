// Blog girdi doğrulaması (bağımlılık eklememek için elle yazıldı).

export interface BlogInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
}

export const LIMITS = { title: 200, slug: 120, excerpt: 500, content: 100_000 } as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseBlogInput(
  body: unknown,
  mode: "create" | "update"
): Result<Partial<BlogInput>> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Geçersiz istek gövdesi." };
  const b = body as Record<string, unknown>;
  const out: Partial<BlogInput> = {};

  const title = str(b.title)?.trim();
  if (title !== undefined) {
    if (!title || title.length > LIMITS.title) return { ok: false, error: "Başlık 1-200 karakter olmalı." };
    out.title = title;
  }

  const slug = str(b.slug)?.trim();
  if (slug !== undefined) {
    if (slug.length > LIMITS.slug || !SLUG_RE.test(slug)) {
      return { ok: false, error: "Slug yalnızca küçük harf, rakam ve tire içerebilir." };
    }
    out.slug = slug;
  }

  const content = str(b.content);
  if (content !== undefined) {
    if (!content.trim() || content.length > LIMITS.content) {
      return { ok: false, error: "İçerik boş olamaz ve 100.000 karakteri aşamaz." };
    }
    out.content = content;
  }

  // Boş excerpt geçerlidir (otomatik üretilir / temizlenebilir).
  const excerpt = str(b.excerpt);
  if (excerpt !== undefined) {
    if (excerpt.length > LIMITS.excerpt) return { ok: false, error: "Özet 500 karakteri aşamaz." };
    out.excerpt = excerpt;
  }

  if (b.published !== undefined) {
    if (typeof b.published !== "boolean") return { ok: false, error: "published boolean olmalı." };
    out.published = b.published;
  }

  if (mode === "create" && (!out.title || !out.slug || !out.content)) {
    return { ok: false, error: "Başlık, içerik ve slug zorunludur." };
  }
  return { ok: true, value: out };
}
