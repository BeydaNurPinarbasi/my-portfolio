// İstek kaynağı (Origin) kontrolü: CSRF'ye karşı ikinci katman (birincisi SameSite=Strict cookie).
//
// Neden ayrı yardımcı: ters proxy arkasında (Dokploy/Traefik) TLS proxy'de sonlanır ve uygulama
// isteği http olarak görür; `new URL(req.url).origin` "http://..." olur, tarayıcının gönderdiği
// "https://beyda.dev" ile eşleşmez ve meşru istekler 403 alır.
//
// Çözüm: production'da kabul edilen kaynak(lar) SITE_URL ile AÇIKÇA tanımlanır (virgülle birden fazla,
// ör. "https://beyda.dev,https://www.beyda.dev"). X-Forwarded-* başlıklarına güvenilmez.
// SITE_URL yoksa (yerel geliştirme) isteğin kendi kaynağı kullanılır.

function allowedOrigins(req: Request): string[] {
  const configured = process.env.SITE_URL;
  if (configured) {
    return configured
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((s) => {
        try {
          return [new URL(s).origin];
        } catch {
          return [];
        }
      });
  }
  try {
    return [new URL(req.url).origin];
  } catch {
    return [];
  }
}

/** Tarayıcılar mutasyon isteklerinde Origin gönderir; Origin yoksa ya da eşleşmezse reddedilir. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return allowedOrigins(req).includes(origin);
}
