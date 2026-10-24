// Dosya tabanlı blog deposu (geçici katman).
// Veritabanına geçişte (Supabase) yalnızca bu dosyanın içi değişir.
//
// Önemli: Vercel gibi ortamlarda dosya sistemi salt okunurdur; yazma
// StorageUnavailableError fırlatır ve endpoint 503 döner. Bu bir hata değil,
// "yazma desteklenmiyor" sinyalidir (sessizce veri kaybetmekten iyidir).

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

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

export class StorageUnavailableError extends Error {}

const BLOG_DIR = path.join(process.cwd(), "data");
const BLOG_FILE = path.join(BLOG_DIR, "blog.json");

export async function readPosts(): Promise<BlogPost[]> {
  try {
    const raw = await readFile(BLOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

// Aynı süreç içindeki eşzamanlı yazmaları sıraya dizer (read-modify-write yarışı).
let queue: Promise<unknown> = Promise.resolve();

export function mutatePosts<T>(fn: (posts: BlogPost[]) => { posts: BlogPost[]; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const current = await readPosts();
    const { posts, result } = fn(current);
    try {
      await mkdir(BLOG_DIR, { recursive: true });
      // Atomik yazım: yarım kalan dosya blog.json'u bozmasın.
      const tmp = `${BLOG_FILE}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(posts, null, 2), "utf-8");
      await rename(tmp, BLOG_FILE);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
        throw new StorageUnavailableError("Bu ortamda yazma desteklenmiyor.");
      }
      throw err;
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function toPublicPost(post: BlogPost): BlogPost {
  return post; // yalnızca yayınlanmışlar bu fonksiyona ulaşır; alan filtresi ileride buraya
}
