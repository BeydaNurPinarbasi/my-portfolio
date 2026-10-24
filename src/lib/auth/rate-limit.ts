// Basit bellek içi sabit pencere sınırlayıcı.
//
// Tek, uzun ömürlü Node sürecinde (Docker/Dokploy) sayaçlar süreç boyunca tutulur; yeniden
// başlatmada sıfırlanır. Birden fazla replika çalıştırılırsa her biri kendi sayacını tutar:
// o durumda paylaşılan bir depo (ör. Redis) ya da proxy düzeyinde (Traefik) limit gerekir.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * İstemci IP'si. X-Forwarded-For'un SOLDAKİ değerleri istemci tarafından uydurulabilir;
 * güvenilir proxy'ler başlığın SONUNA ekler. Bu yüzden sağdan, güvenilir proxy sayısı kadar
 * içeriden okunur. TRUSTED_PROXY_HOPS: uygulamanın önündeki proxy sayısı
 * (Dokploy/Traefik tek başına = 1, önünde Cloudflare da varsa = 2). Varsayılan 1.
 */
export function clientIp(req: Request): string {
  const hops = Math.max(1, Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    const ip = parts[Math.max(0, parts.length - hops)];
    if (ip) return ip.slice(0, 64);
  }
  return req.headers.get("x-real-ip")?.slice(0, 64) ?? "unknown";
}
