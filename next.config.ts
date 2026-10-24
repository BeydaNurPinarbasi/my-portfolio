import type { NextConfig } from "next";
import path from "path";

// Temel güvenlik başlıkları. CSP bilerek burada yok: Next'in inline script'leri
// için nonce tabanlı bir CSP ayrı bir adım olarak (proxy.ts ile) eklenmeli.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Docker/Dokploy: yalnızca çalışması gereken dosyaları içeren küçük, bağımsız sunucu çıktısı
  // (.next/standalone). Dockerfile bunu kullanır.
  output: "standalone",
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Eski projeler sayfası kaldırıldı; seçili çalışmalar ana sayfada (yayın izni olanlar gelince).
      { source: "/projects", destination: "/#work", permanent: true },
    ];
  },
};

export default nextConfig;
