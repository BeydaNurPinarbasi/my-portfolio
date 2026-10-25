# Kişisel hikâye: içerik mimarisi ve 3D koreografi

> Durum: gerçek rotalarda (`/`, `/about`). Kamera ve sahne davranışlarının ayrıntısı: `docs/motion-direction.md`.
> Güvenlik çalışması (Phase 0) ayrı ve öncelikli bir iş olarak takip edilir; bu doküman onu kapsamaz.

## 1. Omurga: Merak → Üretim → Sorumluluk

| Perde | Tanım (kullanıcının ifadesi) | Bölümler | Altı özellikten karşılığı |
|---|---|---|---|
| I · Merak | Bilgiyi keşfetmek ve sorular sormak | 01 Keşif, 02 Merakın Peşinde | Disiplinler arası merak, Bilgi paylaşımı |
| II · Üretim | Fikirleri çalışan yazılım sistemlerine dönüştürmek | 03 Üretim, 04 Bütünsel düşünme, 05 Sorgulayıcı yaklaşım | Bütünsel düşünme, Sorgulayıcı yaklaşım |
| III · Sorumluluk | Ürettiğim işin ve kurduğum ilişkilerin arkasında durmak | 06 Çalışma biçimim, 07 Gelecek | İnsani çalışma değerleri, Bağımsız üretim (hedef) |

Her perde bir **perde kartıyla** açılır: dev tek kelime (`Merak`, `Üretim`, `Sorumluluk`), ağırlığı scroll ile artar.
Sağdaki ilerleme rayı üç perdeyi gösterir; ziyaretçi hikâyenin neresinde olduğunu her zaman bilir.

Ana sayfa **özet**, Hakkımda **derinlik**: aynı konular, farklı metin. Hakkımda da aynı üç perdeyle düzenlenir.

## 2. Sahne → 3D durum → anlam

Tek yapı (5 katman, tek instanced draw call) her bölümde farklı bir biçime girer. Biçimler shader'da
morph hedefleri olarak hesaplanır: `stack` (katmanlı), `field` (takımyıldız), `form` (disk).

| Bölüm | 3D | Anlam | DOM hareketi (her biri farklı) |
|---|---|---|---|
| Hero | Parçalar havada süzülür | Henüz yolu bulmamış merak | Harfler ince→kalın yükselir (CSS) |
| 01 Keşif | Parçalar katmanlara oturur | Yazılımda kendini bulmak | Satırlar alttan maskeyle açılır |
| 02 Merakın Peşinde | Katmanlar bilgi alanı kümelerine dağılır; merkezde küçük yazılım çekirdeği, aralarında ışık akan bağlar | Alanların birbiriyle ilişkisi; bilgi merkezden dışa paylaşılır | Alan düğmeleri; üzerine gelince ilgili küme ve bağları öne çıkar |
| 03 Üretim | Kümeler sıkı bir yapıya toplanır, içinden yukarı akan ışık darbeleri geçer | Fikir, çalışan bir sisteme dönüşür | Kelimeler sırayla kalınlaşır (scrub) |
| 04 Bütünsel düşünme | Katmanlar ayrılır, tek tek aktifleşir, sonra yeniden birleşir | Parçalar ve bütün | Yetkinlik listesi adım adım; birleşmede kesişen konular yanar |
| 05 Sorgulayıcı yaklaşım | Bir katman raf çekmecesi gibi yapıdan kayar; blueprint görünümü, ölçü etiketleri | Bir tercihi yerinden çıkarıp çizim masasında incelemek | Gerekçe / Risk / Alternatif sütunları çizgiyle sırayla açılır |
| 06 Çalışma biçimim | Yapı sakinleşir, kenara çekilir; ışık yavaşlar | Kontrollü, özenli çalışma | Değer kelimeleri merkezden geçerken kalınlaşır (kinetik) |
| 07 Gelecek | Beş katman tek bir dairesel zeminde eşit dilimlere dönüşür | Ortak, dengeli bir yapı | Metin bulanıktan nete (gelecek netleşiyor) |

Renk kuralı (bkz. creative-direction §3): **renk = katman**. Katman i hangi biçimde olursa olsun aynı tonu taşır.
Merakın Peşinde'de katman i bir bilgi alanını temsil eder; alan listesindeki nokta aynı tondadır.

## 3. Mimari

```
src/content/                 Tip güvenli içerik modeli (tek doğruluk kaynağı)
  types.ts                   Pillar, Trait, Chapter, Domain, Value, WorkItem, ...
  profile.ts pillars.ts traits.ts expertise.ts domains.ts values.ts work.ts
  home.ts about.ts seo.ts
src/lib/design/palette.ts    Renk dili (3D + CSS aynı değerler)
src/components/story/
  choreography.ts            SAF fonksiyon: bölüm konumu -> sahne durumu (test edilebilir)
  StoryStage.tsx             İstemci: sticky canvas, ScrollTrigger, etkileşim (tek client sınırı)
  sections.tsx               Sunucu bileşenleri: bölümler (HTML'de tam metin)
  StoryGlyph.tsx             SVG: WebGL yoksa/JS yoksa her bölümün statik karşılığı
  about/Constellation.tsx    Hakkımda: hafif DOM/SVG etkileşimli alan haritası (WebGL yok)
src/components/immersive/scene/createStoryScene.ts   setState() ile sürülen Three.js sahnesi
scripts/check-content.mjs    İçerik kuralları denetimi (unvan, sayısal iddia, hedef dili)
```

- Metin canvas'a hapsolmaz: bölümler normal akışta sunucuda render edilir; canvas `aria-hidden` arka plandır.
- Scroll-jacking yok: sahne `position: sticky`; ScrollTrigger yalnızca bölüm ilerlemesini okur.
- Durum hesabı saf fonksiyon (`stateAt`) olduğu için tween çakışması yok; aynı uniform'u iki tween sürmez.
- Hakkımda'da WebGL yok (uzun okuma sayfası, performans önceliği); aynı görsel dil SVG ile.

## 4. Mobil

- Aynı bölümler, aynı sıra, aynı anlam. Yapı ekranın üst yarısında, metin alt yarıda okunabilirlik kartında.
- `lite` seviye: 8×8 ızgara, imleç yok; Merakın Peşinde'de alanlar dokunarak seçilir.
- WebGL yoksa her bölümde `StoryGlyph` aynı biçimi (saçılma, katman, takımyıldız, disk...) statik gösterir.

## 5. Erişilebilirlik / reduced-motion / SEO

- Başlık hiyerarşisi: tek `h1`, perde ve bölüm başlıkları `h2`/`h3`. Landmark: `header/nav`, `main`, `footer`.
- `prefers-reduced-motion`: metin animasyonu yok, 3D her bölümde tek kare (geçişsiz).
- Alan düğmeleri gerçek `<button>`, `aria-pressed`, klavye ile odaklanınca da sahneyi sürer.
- `/lab` noindex. Yayına hazır metadata ve `Person` JSON-LD (`jobTitle: Yazılım Geliştirici`, işveren/müşteri yok) `src/content/seo.ts`'te.

## 6. İçerik kuralları (bağlayıcı)

- Unvan yalnızca Yazılım Geliştirici / Software Developer.
- Müşteri, şirket, marka, logo, gizli proje bilgisi yok. Seçili çalışmalar yalnızca `permission: "verified"` veya `"own-demo"` ile görünür (fail-closed).
- Hedefler (`tense: "goal"`) gerçekleşmiş başarı gibi yazılmaz; denetim betiği hedef dilini kontrol eder.
- Sayısal iddia (yıl, proje, kullanıcı sayısı) yok.
- Alan açıklamaları uzmanlık iddiası değil, **soru** olarak yazıldı (araştırmacı ama unvan iddiası yok).
