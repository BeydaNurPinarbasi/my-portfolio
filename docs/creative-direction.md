# STRATA — beyda.dev yaratıcı yön (Phase 1)

> Durum: öneri. Hero prototipi `/lab/hero` rotasında yaşıyor; mevcut ana sayfa değişmedi.

## 1. Konsept

**Strata** — bir yazılım sisteminin katmanları.

Bir isteğin (request) bir sistemden geçişi, sitenin tek anlatı metaforu:
mobil arayüzden web'e, oradan servislere, veriye ve güvenlik katmanına inen **tek bir ışık hattı**.
Bu hat (rosewood) sahne boyunca tek vurgu rengidir; her katmana değdiğinde o katman "uyanır".

Neden bu konsept:
- Dekoratif küre/parçacık yerine, işin kendisini (katmanlı sistem mimarisi) görselleştirir.
- Yetkinlik listesi (mobil, web, backend, veri/altyapı, güvenlik) zaten doğal bir katman sırası.
- Scroll = isteğin aşağı doğru ilerlemesi. Hareketin bir nedeni var.

Sanat yönü: **Pastel blueprint.** Krem zemin üzerinde, her biri kendi tonunda pastel katmanlar.
Midnight kenar çizgileri yapıyı okutur; tek rose ışık hattı odağı taşır. Süs yok; her çizgi bir modül sınırı.

## 2. Tipografi

| Rol | Font | Kullanım |
|---|---|---|
| Display | **DM Sans** (variable, `wght` 100–1000, `opsz`) | Başlıklar. Ağırlık ekseni *kinetik* olarak animasyonlanır. |
| Mono | **DM Mono** (400/500) | Etiketler, indeksler (`01`), açıklama metni. |

- Başlıklar cümle düzeninde (`Yazılım Geliştirici`, `Veri & Altyapı`); büyük harf dizilimi yok.
- Ölçek: hero başlığı `clamp(2.8rem, ~9.6vw, 10rem)`, sıkı aralık (`-0.035em`); mono etiketler 11–12px, geniş aralık.
- Kinetik kural: **ağırlık = enerji.** Odaktaki öğe kalın (~720–760), geri çekilen öğe ince (~260–340).
  Giriş: harfler ince başlayıp kalınlaşarak yükselir. Scroll: başlık incelir ve çıkar.
- Gerçek `<h1>` metni her zaman DOM'da; parçalanmış harfler `aria-hidden`.

## 3. Renk dili

Tek kaynak: `src/lib/design/palette.ts` (3D sahne buradan okur; `immersive.css` aynı değerleri taşır).
Üç kat: **palet → roller → kategori.** Bileşenler ham palet değerini değil, rol token'ını kullanır.

**Palet**

| Ad | Değer |
|---|---|
| Vanilla Cream | `#FFF7E6` |
| Blush Petal | `#F7C8D3` |
| Rosewood | `#B46A72` |
| Sage Leaf | `#A8B58A` |
| Misty Sky | `#A9B7C6` |
| Midnight Lagoon | `#2D3A47` |

**Roller**

| Token | Kaynak | Ne için |
|---|---|---|
| `--imm-bg` | cream | Zemin. Her zaman. |
| `--imm-ink` | midnight | Birincil metin, kontur, 3D kenar çizgisi |
| `--imm-ink-2` / `--imm-ink-3` | midnight + cream karışımı | İkincil metin / etiket ve pasif öğe (küçük metinde ≥4.5:1) |
| `--imm-line` | midnight %16 | Ayırıcı çizgi |
| `--imm-accent` | rosewood | **Odak/etkileşim:** aktif durum, ilerleme rayı, ışık hattı (grafik) |
| `--imm-accent-ink` | `#8C4952` | Odak rengi **metin** olduğunda (rosewood küçük metinde kontrast vermez) |
| `--imm-wash` | blush | Vurgu yüzeyi (seçili arka plan) |

**Kategori:** her yetkinliğin bir tonu var (`capabilities.ts → tone`). Aynı ton 3D katman yüzeyinde, listede
nokta/etikette ve SVG yedekte kullanılır. Böylece renk = hangi katman.

| Yetkinlik | Ton |
|---|---|
| Mobil | blush |
| Web | sky |
| Backend | sage |
| Veri & Altyapı | dusk `#D2A2A0` (rose %60 + cream) |
| Güvenlik & Otomasyon | slate `#717F8D` (midnight %45 + sky) |

Kurallar:
- Pastel tonlar **asla metin rengi** değildir; yalnızca yüzey/işaret.
- Rose ekranda tek eylem/odak rengidir; kategori rengi olarak kullanılmaz.
- Aktif durum = rose kenar + kategori tonunda dolgulu etiket. Pasif = `ink-3`.
- Mor-mavi gradient yok; gradient yalnızca zeminde yumuşak ışık lekesi olarak.

## 4. Kompozisyon prensipleri

1. **Asimetri.** Başlık sol-alt, yapı sağ-üst; boşluk bilinçli.
2. **Ölçek çatışması.** Dev başlık ↔ 11px mono etiket. Orta boy metin yok.
3. **Üst üste binme.** Başlık 3D yapının önünden geçer; ikinci satır kontur (outline) olup scroll ile dolar, yapı içinden görünür.
4. **Editorial grid.** 12 kolon; indeksler ve etiketler kolon çizgilerine hizalı. Kart yok.
5. **Hareket tek yönlü okunur.** Her ana hareket yukarıdan aşağı (isteğin yönü).

## 5. Scroll hikâyesi

| Sahne | İçerik | Mekanik |
|---|---|---|
| 01 Giriş | Yapı parçalardan kurulur, başlık maskeyle yükselir | Zaman tabanlı giriş (scroll beklemez) |
| 02 Katmanlar | Yapı ayrışır; 5 katman sırayla aktifleşir | ScrollTrigger scrub, sticky sahne |
| 03 Seçilmiş çalışma | Yatay editoryal vitrin | Phase 3 |
| 04 Hakkımda | Tipografik anlatı | Phase 3 |
| 05 Yazılar | Editoryal yayın | Phase 3 |
| 06 İletişim | Kapanış sahnesi: ışık hattı yapıya geri döner | Phase 3 |

**Scroll-jacking yok.** Sayfa doğal kaydırılır. Sahne, uzun bir kapsayıcı içinde `position: sticky` olur;
ScrollTrigger yalnızca ilerleme değerini (0–1) okur. Kullanıcı kaydırmayı hiçbir zaman kaybetmez.

## 6. 3D sahne konsepti (Phase 2'de uygulandı)

- 5 katman = 5 yetkinlik. Her katman **kendi desenine** sahip modül ızgarası (telefon çerçevesi, tarayıcı penceresi, sunucu rafları, veri blokları, kilit kafesi).
- Tek `InstancedMesh` benzeri geometri (tek draw call), özel shader: kurulum animasyonu GPU'da, instance başına rastgele gecikme/dönüş.
- Yüzeyler katmanın kategori tonunda pastel; **kenarlar shader'da çizilir** (UV tabanlı, midnight), böylece wireframe değil, mimari çizgi.
- Işık hattı: dünya Y ekseninde süpüren bir bant. Etkinleşen katmanda kenarlar rosewood olur.
- Fare: kamera ve yapı yavaşça yönelir + imlecin yakınındaki modüller öne doğru kabarır (shader'da).
- Dokunmatik: imleç yok → dokunuş "ışık darbesi" tetikler; sahne scroll'a bağlı ilerler.

## 7. Hareket koreografisi

Süreler: `fast 0.25s · base 0.6s · slow 1.2s · intro 2.8s`. Eğriler: giriş `power3.out`, geçişler `power3.inOut`, scrub `none`.

| Zaman | Olay |
|---|---|
| 0.00s | İçerik ve SVG yer tutucu görünür (bekleme ekranı yok) |
| 0.05–0.9s | Başlık harfleri maskeden yükselir, `wght` ~380 → 760 (CSS, JS'siz çalışır) |
| 0.15–2.9s | Parçalar saçılmış konumdan kurulur (GPU, `uAssemble`) |
| ~3.0s | İlk ışık hattı süpürmesi |
| scroll 0–0.22 | Başlık incelir ve yukarı çıkar; ikinci satır konturdan dolguya |
| scroll 0.06–0.30 | Katmanlar ayrışır (`uExplode`) |
| scroll 0.28–0.92 | 5 katman sırayla aktifleşir; her birinin açıklaması **farklı** açılır: soldan maske, aşağıdan maske, harf harf, blur→net, tarama çizgisi |
| scroll 0.92–1 | Yapı geriye çekilir, sonraki sahneye devreder |

## 8. Duyarlı deneyim

| Seviye | Koşul | Davranış |
|---|---|---|
| `full` | İnce imleç, ≥768px, yeterli çekirdek/bellek | 12×12 ızgara, DPR ≤2, MSAA, imleç etkileşimi |
| `lite` | Dokunmatik, dar ekran veya düşük donanım | 8×8 ızgara, DPR ≤1.5, MSAA yok, imleç yok, dokunuş darbesi |
| `static` | `prefers-reduced-motion` | Tek kare render, döngü yok, scrub yok; katman listesi normal akışta |
| `none` | WebGL2 yok / bağlam kaybı | Saf SVG izometrik kompozisyon (aynı yer tutucu) |

Çalışma zamanında uyarlama: ilk ~90 karede ortalama kare süresi yüksekse DPR 1'e düşer.
**Kesin FPS iddiası yoktur**; gerçek cihaz ölçümü Phase 5'te.

## 9. Teknik mimari ve sorumluluk ayrımı

```
src/app/lab/layout.tsx         Sunucu. Üretimde kapalı (notFound), noindex, fontlar
src/app/lab/hero/page.tsx      Sunucu. <ImmersiveHero /> yerleştirir
src/components/immersive/
  ImmersiveHero.tsx            İstemci. DOM + GSAP/ScrollTrigger orkestrasyonu
  HeroFallback.tsx             Saf SVG. SSR'da görünür, WebGL yoksa kalır
  capabilities.ts              Doğrulanmış yetkinlik verisi
  detect.ts                    Seviye tespiti (full/lite/static/none)
  immersive.css                Kapsamlı (.imm-*) stiller, token'lar
  scene/createHeroScene.ts     Saf Three.js fabrikası (React'tan bağımsız)
  scene/shaders.ts             GLSL
  scene/layers.ts              Katman desenleri (üretken veri)
```

| Kütüphane | Sorumluluk | Dokunmadığı alan |
|---|---|---|
| **GSAP + ScrollTrigger** | Scroll ilerlemesi, başlık/katman tipografisi, sahne uniform'ları, giriş zaman çizelgesi | Mikro etkileşim, bileşen mount/unmount |
| **Three.js (vanilla)** | WebGL sahne, shader, render döngüsü | DOM, React durumu |
| **Motion (Framer)** | Mevcut sayfalar, mikro etkileşimler, bileşen geçişleri (Phase 3) | Hero sahnesi: aynı DOM özelliğini GSAP ile paylaşmaz |

**Neden React Three Fiber değil:** sahne tek, özel shader'lı ve imperatif olarak GSAP'ye bağlı. R3F React yeniden render
döngüsüne ek soyutlama ve iki bağımlılık (`@react-three/fiber`, `drei`) getirirdi; kazanç yok. Sahne React'tan bağımsız
bir fabrika olduğu için ileride Phase 3'te çoklu sahne gerekirse R3F yeniden değerlendirilir.

**Yaşam döngüsü kuralları:** tüm GSAP/ScrollTrigger `gsap.context` içinde; unmount'ta `ctx.revert()`. Three kaynakları
(`geometry/material/renderer`) `dispose()`; `IntersectionObserver` ile ekran dışındayken döngü durur; `visibilitychange` ile sekme gizlenince durur.

## 10. İçerik ve gizlilik kuralları (bu doküman dahil bağlayıcı)

- Unvan: **Yazılım Geliştirici** / *Software Developer*. "Engineer/Architect/Lead" yok.
- Müşteri/şirket adı, logo, gizli proje adı, alan adı, ekran görüntüsü **yok**. Yetkinlik metinleri genel ve doğrulanmış.
- Sayısal iddia (yıl, proje sayısı, memnuniyet) **yok**. Mevcut sitedeki bu tür sayılar yeni tasarıma taşınmaz.
- Eski sitedeki proje kartları (`Otelproject*` görselleri vb.) gerçek proje olabilir; yayın izni doğrulanana kadar yeni tasarıma **alınmaz**.
- Yayın izni doğrulanmayan her şey `draft/private`.

## 11. Prototip (Phase 2) — nasıl açılır

```bash
npm run dev          # ardından http://localhost:3000/lab/hero
```

- Üretimde `/lab` varsayılan olarak **404** döner. Bilerek açmak için `ENABLE_LAB=true` (build ve runtime'da).
- Ana sayfa (`/`) değişmedi; `/lab` Navbar/Footer'ı kullanmaz (`PublicLayout` içinde tek satırlık istisna).
- `three` ve `gsap` yalnızca bu rotada yüklenir; `three` ayrı lazy chunk'tadır (~132 KB gzip).
