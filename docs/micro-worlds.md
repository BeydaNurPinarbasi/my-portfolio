# Mikro dünyalar ve semantik zoom · İterasyon 4 (prototip: Backend)

Hedef: kamera yalnızca büyümesin; yaklaştıkça **içerik ve detay seviyesi** değişsin. İlk prototip yalnızca Backend
katmanında. Aynı yaklaşım sonra Mobil, Web, Veri & Altyapı ve Güvenlik & Otomasyon'a farklı davranışlarla genişleyecek.

## Üç seviye

| Seviye | Ne görünür | Nasıl girilir | Nasıl çıkılır |
|---|---|---|---|
| 0 Genel görünüm | Beş katman, hover/parallax | — | — |
| 1 Katman detayı | Backend çekmece gibi açılır, panel | Katmana tıkla / sol listeden "aç" | Geri, Esc, arka plan, scroll |
| 2 Mikro dünya | Bir modülün içi: **gerçekten farklı bir kompozisyon** | Backend detayında bir modüle tıkla ya da "Bir modülün içine gir" düğmesi | Geri (→ seviye 1), Esc, scroll |

Geri düğmesi iki adımdır (mikro dünya → katman detayı → genel görünüm). Esc daha ince: açıklama → mikro dünya →
katman detayı → genel görünüm.

## Mikro dünyanın içeriği (genel ve özgün)

Gerçek bir sistemin topolojisi, müşteri mimarisi ya da proje değildir; panelde açıkça yazılıdır
(`content/microworld.ts` → `disclaimer`). Fikir: **bir isteğin servis içinden geçişi.**

| # | Yapı (3D) | Kavram |
|---|---|---|
| 01 | Kapı: iki direk, lento, içinden geçen istek levhaları | API: giriş kapısı, sözleşme |
| 02 | Kilit gövdesi, kanca, bariyer direkleri | Kimlik doğrulama: kontrol noktası, güvenlik sınırı |
| 03 | Basamaklı pedler, karar elması, dönen dişli | İş mantığı: karar ve akış |
| 04 | Silindir istifi, nabız atan halka | Veritabanı: kalıcı durum |

**Yönlü akış:** alt hat = istek (API → Kimlik → İş mantığı → Veritabanı, vurgu rengi paketler),
üst yaylar = yanıt (Veritabanı → İş mantığı → API, mürekkep rengi paketler). Yön hem paket hareketinden hem ok
başlarından okunur (reduced-motion'da hareketsiz karede de). Bir servisin üstüne gelince ona bağlı akışlar parlar.

## Geçiş: tek GSAP zaman çizelgesi

Kamera dahil tüm geçiş **tek bir `gsap.timeline`**'dadır (`StoryStage.ensureMicroTl`). Zaman çizelgesi
`scene.micro` nesnesini sürer; sahne yalnızca okur:

```
0.00  dip      0→1   makro dalış: kamera modüle fazladan yaklaşır
0.15  blend    0→1   kamera devri (katman kamerası → mikro kamera: hedef, yön, logaritmik uzaklık)
0.35  shrink   0→1   tıklanan modül kabuğa yerini bırakır
0.55  k        0→1   kabuk modül boyundan dünya boyuna büyür
0.60  open     0→1   duvarlar menteşelerinde yatar, kapak kalkar
0.80  dip      1→0   kamera geri çekilir
1.20  rise     0→1   servisler sırayla yükselir
1.70  flow     0→1   yönlü veri akışı başlar
```

**Çakışma önleme:** scroll yalnızca `cur` (genel sahne) durumunu sürer, mikro kamera `blend` ile karışır; ikisi aynı
değeri sürmez. Geçiş sürerken girdi kilitlidir (yalnızca Geri/Esc zaman çizelgesini **tersine çevirir**); scroll ile
çıkış koşulu geçiş bitince değerlendirilir. Servis seçimine yaslanma (`microSel`) ayrı bir nesne ve ayrı bir
tween'dir, ana zaman çizelgesine karışmaz.

## İkinci seviye seçim (GPU picking genişletmesi)

Mevcut modül seçimi **bozulmadı**: aynı 1×1 hat, aynı kodlama (id+1, iki bayt), aynı histerezis. Mikro dünya
kamerayı devralınca (`blend > 0.5`) seçim, modüller yerine mikro dünya servislerini çizer; servis kimlikleri
`MICRO_PICK_BASE = 1000`'den başlar (modül numaralarıyla çakışmaz). Hover: etiket genişler, servis ve akışlar
parlar, imleç "aç". Tıklama: kısa açıklama (panelde) + kamera servise yaslanır.

## Mobil
- Modüle dokun → mikro dünya; 3D'de servise dokun → seçilir (tek dokunuş).
- Panel alttan açılan sayfa, ekranın ≤%46'sı: servisler 2×2 düğme (≥44 px), kavram kartı altında.
- Pasif etiketler yalnızca numara; adlar düğmelerde. Dikey scroll ve yakınlaştırma bozulmaz.

## Yedek yollar
- **Reduced motion:** zaman çizelgesi tek kareye atlar (`progress(1)`), akış hareketsiz (paketler sabit, oklar görünür),
  dişli ve nabız yok. Panel ve düğmeler aynı.
- **WebGL yok:** panel 3D olmadan çalışır: Backend detayında servis düğmeleri ve açıklamalar metin olarak aynı panelde.

## Performans ölçümü

Ölçüm kancası **yalnızca `?perf=1` ile** açılır (gerçek sitede yok): sol altta kare süresi, sahne CPU süresi,
seçim süresi, çizim çağrısı, üçgen sayısı gösterilir ve `window.__story` otomatik testleri sürer.
Kendi cihazında ölçmek için adrese `?perf=1` ekle.

**Ortam:** Apple M3 (ANGLE Metal), Chrome başsız, üretim Docker imajı, retina (DPR 2). Mobil profil: 390×844 @3x,
4× CPU kısıtlaması (**yalnızca CPU; mobil GPU'yu temsil etmez**). Her senaryo 5 sn örneklem.

| Senaryo | fps (vsync) | kare ms (p95) | kapasite (sınırsız) | sahne CPU | çizim | üçgen |
|---|---|---|---|---|---|---|
| Genel görünüm, durağan | 60 | 16.7 (19) | 4.2 ms ≈ 240 fps | 0.08–0.4 ms | 4 | 2.8k |
| Genel görünüm, hover seçimi | 59–60 | 16.9 (19) | 5.4 ms ≈ 184 fps | 0.14–0.4 ms | 4 | 2.8k |
| Katman detayı (Backend) | 60 | 16.7 (18) | 4.6 ms ≈ 219 fps | 0.13–0.2 ms | 4 | 2.8k |
| **Mikro dünyaya geçiş (3.2 sn)** | 60 | 16.7 (19), en kötü 34 | 4.4 ms ≈ 226 fps | 0.3–0.9 ms | 74 | 5.0k |
| **Mikro dünya, akış çalışıyor** | 60 | 16.7 (18) | 4.3 ms ≈ 233 fps | 0.5–1.0 ms | 74 | 5.0k |
| **Mikro dünya, 2. seviye seçim** | 60 | 16.7 (19) | 4.9 ms ≈ 204 fps | 0.3–1.0 ms | 74 | 5.0k |
| Mobil (4× CPU kısıtı), mikro dünya | 60 | 16.7 (18–19) | — | 0.3–0.6 ms | 74 | 3.9k |

- **GPU seçimi maliyeti:** komutları gönderme (CPU) ≈ 0.2 ms; sonuca kadar toplam ≈ 12–17 ms (≈ 1 kare). En çok ~20 Hz,
  yalnızca imleç hareket ederken. Kare süresine etkisi p95'te görünmüyor.
- **Mikro dünyanın maliyeti:** genel görünüme göre +70 çizim çağrısı, +2.2k üçgen; kare süresi kapasitede ≈ +0.1 ms.
- **İlk kullanım sıçramaları ölçüldü ve giderildi:** shader'lar ilk kullanımda derleniyordu (mikro dünyaya ilk geçişte
  en kötü kare 106 ms; mobil kısıtlı profilde 158–260 ms). Boşta ısıtma (`warmShaders`, render target ile) sonrası: 17–36 ms,
  ilk ve ikinci geçiş aynı (mobil kısıtlı profilde 32–50 ms). Ölçüm kutusunun kendisi de takılma üretiyordu (GPU adı
  sorgusu GPU sürecine eşzamanlı gidiş-dönüş yaptırıyordu): ad önbelleğe alındı; etiketlerin değişmeyen öznitelikleri
  her karede yeniden yazılıyordu (boştayken saniyede binlerce stil hesaplaması): yalnızca değişince yazılıyor.
- Sınırsız modda seçim toplam süresi 25–76 ms görünür: GPU doygunken komut kuyruğu bekletiyor; vsync altında ≈ 1 kare.

**Ölçülmeyenler:** gerçek bir telefonun GPU'su, düşük donanımlı bir bilgisayar, 120 Hz ekran. Ölçüm sırasında aynı makinede
başka bir Chrome GPU'yu paylaşıyordu; tek tek sıçramalar bu yüzden gürültülü olabilir (tekrarlı koşularla ayıklandı).
