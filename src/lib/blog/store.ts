// Blog deposu: PostgreSQL (bkz. lib/db).

import { DatabaseUnavailableError, ensureSchema, getPool } from "@/lib/db";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Veritabanı yapılandırılmamış/ulaşılamıyor: endpoint 503 döner ("yazma desteklenmiyor" sinyali).
export class StorageUnavailableError extends Error {}

interface Row {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

const toPost = (r: Row): BlogPost => ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  excerpt: r.excerpt,
  content: r.content,
  published: r.published,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
});

// Bağlantı/yapılandırma hatalarını StorageUnavailableError'a çevirir; diğer hatalar olduğu gibi geçer.
async function db<T>(fn: (pool: ReturnType<typeof getPool>) => Promise<T>): Promise<T> {
  try {
    await ensureSchema();
    return await fn(getPool());
  } catch (err) {
    const msg = err instanceof Error ? `${err.message} ${(err as NodeJS.ErrnoException).code ?? ""}` : "";
    if (err instanceof DatabaseUnavailableError || /Connection terminated|timeout|ECONN|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/i.test(msg)) {
      throw new StorageUnavailableError("Veritabanına ulaşılamıyor.");
    }
    throw err;
  }
}

export async function readPosts(): Promise<BlogPost[]> {
  return db(async (pool) => (await pool.query<Row>("SELECT * FROM blog_posts ORDER BY created_at ASC")).rows.map(toPost));
}

export type NewPost = Pick<BlogPost, "id" | "title" | "slug" | "excerpt" | "content" | "published">;

/** Yeni yazı. Slug zaten varsa null döner. */
export async function createPost(p: NewPost): Promise<BlogPost | null> {
  return db(async (pool) => {
    const r = await pool.query<Row>(
      `INSERT INTO blog_posts (id, title, slug, excerpt, content, published)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING
       RETURNING *`,
      [p.id, p.title, p.slug, p.excerpt, p.content, p.published]
    );
    return r.rows[0] ? toPost(r.rows[0]) : null;
  });
}

/** Kısmi güncelleme. Yazı yoksa "notfound", slug başka yazıda kullanılıyorsa "conflict". */
export async function updatePost(
  id: string,
  patch: Partial<Pick<BlogPost, "title" | "slug" | "excerpt" | "content" | "published">>
): Promise<BlogPost | "notfound" | "conflict"> {
  return db(async (pool) => {
    try {
      const r = await pool.query<Row>(
        `UPDATE blog_posts SET
           title     = COALESCE($2, title),
           slug      = COALESCE($3, slug),
           excerpt   = COALESCE($4, excerpt),
           content   = COALESCE($5, content),
           published = COALESCE($6, published),
           updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [id, patch.title ?? null, patch.slug ?? null, patch.excerpt ?? null, patch.content ?? null, patch.published ?? null]
      );
      return r.rows[0] ? toPost(r.rows[0]) : "notfound";
    } catch (err) {
      if ((err as { code?: string }).code === "23505") return "conflict"; // slug UNIQUE ihlali
      throw err;
    }
  });
}

export async function deletePost(id: string): Promise<boolean> {
  return db(async (pool) => ((await pool.query("DELETE FROM blog_posts WHERE id = $1", [id])).rowCount ?? 0) > 0);
}

export function toPublicPost(post: BlogPost): BlogPost {
  return post; // yalnızca yayınlanmışlar bu fonksiyona ulaşır; alan filtresi ileride buraya
}
