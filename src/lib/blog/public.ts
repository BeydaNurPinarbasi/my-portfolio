// Yazıların public okuma katmanı (sunucu). Yalnızca yayınlanmış yazılar; taslaklar buradan hiç çıkmaz.
// Sunum yardımcıları (özet, okuma süresi, başlık listesi) da burada: liste ve detay aynı kuralları kullanır.

import { readPosts, type BlogPost } from "./store";

export async function listPublished(): Promise<BlogPost[]> {
  const posts = await readPosts();
  return posts
    .filter((p) => p.published)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function findPublished(slug: string): Promise<{ post: BlogPost; newer?: BlogPost; older?: BlogPost } | null> {
  const posts = await listPublished();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  return { post: posts[i], newer: posts[i - 1], older: posts[i + 1] };
}

// Satır içi markdown ve emoji temizliği (özet, içindekiler ve metadata için düz metin).
export function plainInline(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Liste ve metadata için okunabilir özet. Kayıtlı özet markdown içeriyorsa ya da başlığı tekrar
 * ediyorsa (yönetim panelinin otomatik özeti), içerikteki ilk gerçek paragraflardan türetilir.
 */
export function summaryOf(post: BlogPost, max = 220): string {
  const title = plainInline(post.title);
  const stored = post.excerpt?.trim() ?? "";
  const clean = stored && !/[#*`>]/.test(stored) && !stored.startsWith(post.title) ? plainInline(stored) : "";
  let text = clean;
  if (!text) {
    const paras = post.content
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l && !/^(#{1,6}\s|[-*+]\s|\d+\.\s|>|---|\*\*\*|```|✔)/.test(l))
      .map(plainInline)
      .filter((l) => l && l !== title);
    for (const p of paras) {
      text = text ? `${text} ${p}` : p;
      if (text.length >= 160) break;
    }
  }
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Okuma süresi (dakika): ~200 kelime/dk, en az 1. Hesaplanan değer; iddia değil. */
export function readingMinutes(post: BlogPost): number {
  const words = post.content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(iso: string): string {
  // Sunucu saat diliminden bağımsız: tarih her zaman İstanbul saatine göre.
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Istanbul" });
}

export interface Heading {
  id: string;
  text: string;
  depth: number; // sayfadaki gerçek seviye (2..4)
}

/**
 * Markdown başlıkları. Yazının en üst başlık seviyesi h2'ye eşlenir (sayfanın h1'i yazı başlığı),
 * böylece içerik hangi seviyeyle yazılmış olursa olsun başlık hiyerarşisi bozulmaz.
 * id'ler sıra numarasıyla üretilir: Markdown bileşeni aynı sırayla aynı id'leri verir.
 */
export function headingsOf(markdown: string): { headings: Heading[]; shift: number } {
  const raw: { depth: number; text: string }[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const m = !inFence && /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) raw.push({ depth: m[1].length, text: plainInline(m[2]) });
  }
  const min = raw.length ? Math.min(...raw.map((h) => h.depth)) : 2;
  const shift = 2 - min;
  return {
    shift,
    headings: raw.map((h, i) => ({ id: `b${i + 1}`, text: h.text, depth: Math.min(6, h.depth + shift) })),
  };
}
