# Dokploy'a kurulum

Uygulama tek bir Docker imajı olarak çalışır (`Dockerfile`, Next.js `standalone` çıktısı).
Yerelde test edildi: imaj build, sayfalar, proxy arkası güvenlik, volume kalıcılığı.

## 1. Uygulama

1. Dokploy → **Create Application** → kaynak: GitHub, depo `my-portfolio`, dal `main`.
2. **Build Type: Dockerfile** (Nixpacks değil). Dockerfile yolu: `Dockerfile`, context: `.`
3. **Port: 3000**.

## 2. Kalıcı veri (zorunlu)

Blog yazıları `data/blog.json` dosyasında. Konteyner yeniden oluşturulunca kaybolmasın diye:

- **Mounts → Volume mount** (named volume, bind mount değil)
  - Volume adı: `beyda-data`
  - Mount path: `/app/data`

İlk açılışta volume boşsa imajdaki yazılar kopyalanır; sonra **asla üzerine yazılmaz**. Admin panelinden
eklenen yazılar volume'da yaşar, yeni deploy'larda korunur.

Bind mount kullanılırsa klasör `app` kullanıcısına (uid 100) yazılabilir olmalı; değilse site çalışır ama
admin'den kayıt 503 döner.

**Yedek:** `beyda-data` volume'unu düzenli yedekleyin (Dokploy → Volume Backups ya da sunucuda `docker run --rm -v beyda-data:/d -v $PWD:/b alpine tar czf /b/blog.tgz -C /d .`).

## 3. Ortam değişkenleri (Environment)

| Değişken | Değer | Not |
|---|---|---|
| `SITE_URL` | `https://beyda.dev` | **Zorunlu.** CSRF (Origin) kontrolü bunu kullanır. Proxy arkasında bu olmadan form ve admin girişi 403 verir. www da kullanılacaksa: `https://beyda.dev,https://www.beyda.dev` |
| `TRUSTED_PROXY_HOPS` | `1` | Önünde yalnızca Traefik varsa 1. Cloudflare proxy (turuncu bulut) da açıksa `2`. |
| `ADMIN_EMAIL` | admin e-postası | |
| `ADMIN_PASSWORD_HASH` | `node scripts/generate-admin-credentials.mjs` çıktısı | Parolanın kendisi hiçbir yere yazılmaz. |
| `SESSION_SECRET` | aynı betiğin çıktısı | Değiştirmek tüm oturumları kapatır. |
| `EMAIL_USER` | Gmail adresi | İletişim formu |
| `EMAIL_PASS` | Gmail **uygulama şifresi** | Hesap şifresi değil. |

- Hiçbiri `NEXT_PUBLIC_` ile başlamaz. Eski `NEXT_PUBLIC_ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_PASSWORD` **eklenmez**.
- Admin değişkenleri eksikse admin girişi ve yazma kapalı kalır (503), site çalışmaya devam eder.
- `EMAIL_*` eksikse form 503 döner; form kullanıcıya mesajı e-posta ile gönderme seçeneği sunar.
- `ENABLE_LAB` **eklenmez** (`/lab` prototipleri production'da 404 kalır).

## 4. Alan adı

Dokploy → **Domains**: `beyda.dev` (ve istenirse `www.beyda.dev`), port 3000, **HTTPS: Let's Encrypt**.
DNS'te A kaydını Dokploy sunucusunun IP'sine yönlendirin.

`www` → apex yönlendirmesi istenirse Dokploy'da redirect tanımlayın; o durumda `SITE_URL` yalnızca apex olabilir.

## 5. Doğrulama (deploy sonrası)

```bash
curl -I https://beyda.dev                 # 200
curl -I https://beyda.dev/projects        # 308 -> /#work
curl -s https://beyda.dev/robots.txt      # /admin, /api, /lab disallow
curl -I https://beyda.dev/lab/hero        # 404
```

- Admin girişi: `https://beyda.dev/admin/login` → giriş → çerez `__Host-bd_admin` (Secure, HttpOnly).
- İletişim formuna kendinize bir deneme mesajı gönderin.

## 6. Vercel'den çıkış

Dokploy çalıştıktan ve DNS taşındıktan sonra:
1. Vercel projesinin Git bağlantısını kesin (yoksa her push Vercel'de de deploy tetikler).
2. Eski deployment'ları silin (her birinin kalıcı bir adresi vardır), sonra projeyi silin.

## Bilinen sınırlar

- Rate limit bellek içi: tek replika için doğru. Birden fazla replika çalıştırılırsa Traefik düzeyinde
  rate-limit middleware'i ya da paylaşılan depo (Redis) gerekir.
- CSP başlığı henüz yok (nonce tabanlı CSP ayrı bir adım).
- `npm run lint` mevcut ESLint yapılandırmasıyla bozuk (Next 16 `next lint`'i kaldırdı); build'i etkilemez.
