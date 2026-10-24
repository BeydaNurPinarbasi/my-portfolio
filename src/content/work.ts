import type { WorkItem } from "./types";

// Seçili çalışmalar. Müşteri projeleri gizlilik sözleşmeleri kapsamında: izin doğrulanmadan buraya
// "published" olarak EKLENMEZ. Müşteri adı, marka, logo, alan adı, ekran görüntüsü kullanılmaz.
export const WORK: readonly WorkItem[] = [];

/** Fail-closed: yalnızca açık izinli ve yayınlanmış çalışmalar. */
export function publicWork(items: readonly WorkItem[] = WORK): WorkItem[] {
  return items.filter((w) => w.status === "published" && (w.permission === "verified" || w.permission === "own-demo"));
}
