# Motion direction · İterasyon 2: "Keşfedilen sistem"

Korunan: pastel palet, editorial tipografi, katmanlı 3D yapı, renk = katman kuralı, scroll-jacking yok.
Değişen: kamera artık izleyici değil, **keşif aracı**. Sahne uzaktan seyredilen bir maket değil;
yaklaştıkça yeni katmanlar açılan bir sistem.

## 1. Anlatı döngüsü: Bütün → Detay → Anlam → Bütün

Her perde aynı döngüyü kendi ölçeğinde yaşar:

| Adım | Kamera | Ekranda |
|---|---|---|
| Bütün | Geniş plan, yüksek açı | Tüm sistem, bağlam |
| Detay | Dolly-in, makro yakın plan | Tek katman / tek modül |
| Anlam | Kilitli kadraj + etiketler | Mimari açıklama (annotation), metin |
| Bütün | Geri çekilme, vinç (crane) | Detayın sistemdeki yeri |

## 2. Kamera dili (bölüm başına farklı)

Kamera artık bir hedef nokta etrafında küresel bir yörüngede (azimut, yükseklik, uzaklık) ve
değişken odak uzaklığıyla (FOV) hareket eder. Kompozisyon için kadraj kaydırılır (lens shift),
yapı yerinden oynatılmaz.

| Bölüm | Çekim | Teknik |
|---|---|---|
| Hero | Kuruluş planı, nefes alan kamera | Geniş, hafif el kamerası sürüklenmesi (drift) |
| Perde kartları | Zemin üstünden geçiş | **Dolly zoom** (FOV açılır, kamera yaklaşır): mekân esner |
| 01 Keşif | **Plan → kesit** | Tepeden (vaziyet planı, blueprint) başlar, parçalar oturdukça perspektife yatar |
| 02 Merakın Peşinde | Yörünge | Kümeler etrafında yavaş tur; alan seçilince kamera o kümeye odak çeker |
| 03 Üretim | **Makro dalış, sahne içinde sahne** | Tek bir modüle yaklaşılır; modülün içinde bütün sistem minyatür olarak kurulur |
| 04 Bütünsel düşünme | **Exploded view + uçuş** | Katmanlar açılır, kamera yığın boyunca iner, her katmanı yakın planda yakalar; diğerleri x-ray |
| 05 Sorgulayıcı yaklaşım | **Teknik çizim** | Uzun odak (düzleşmiş perspektif), blueprint görünümü; incelenen katman raf çekmecesi gibi yana kayar, köşelerine ölçü etiketleri bağlanır |
| 06 Çalışma biçimim | Sabit, uzun lens | Hareket neredeyse durur; özen = sakinlik |
| 07 Gelecek | **Vinç** | Kamera tepeye yükselir, ortak disk planda okunur |
| Kapanış | Geri çekilme | Sistem yeniden bütün olarak |

## 3. Aktif katman davranışı

Aktif katman ayrışır, kameraya doğru öne çıkar, kenarları vurgu rengine döner ve **kendi
davranış dilini** oynatır. Diğer katmanlar kaybolmaz: **x-ray** moduna geçer (yüzeyler saydamlaşır,
yalnızca mimari çizgileri kalır), geri planda sessizleşir.

| Katman | Metafor | Davranış (shader, GPU'da) |
|---|---|---|
| Mobil | Modüler ekran ritmi | Modüller akış (feed) gibi dikey bir dalga hâlinde kayar; ritmik, akıcı |
| Web | Izgara, responsive | Izgara üç kırılma noktası arasında daralıp genişler (breakpoint) |
| Backend | Servis blokları, akış | Servis satırları boyunca istek paketleri ilerler; bağlı modüller sırayla yanar |
| Veri & Altyapı | İstif, node, dağıtım | Merkezden dışa yayılan dalgayla bloklar yükselip iner (yazma, çoğaltma) |
| Güvenlik & Otomasyon | Sınır, doğrulama | Merkezden dışa tarama halkası; geçtiği her modül doğrulanır (vurgu) |

## 4. Eksantrik ama anlamlı anlar

1. **Sahne içinde sahne** (Üretim): bir modülün içine girildiğinde aynı sistem orada da var.
   Anlam: her küçük parça bütünün mantığını taşır; fikir → sistem.
2. **X-ray exploded view** (Bütünsel düşünme): katmanlar açılır, iç yapı görünür.
3. **Blueprint anı** (Sorgulayıcı yaklaşım): yapı teknik çizime döner; kalkan katmana
   "A Gerekçe · B Risk · C Alternatif" ölçü etiketleri bağlanır. Anlam: karar, çizim masasında incelenir.
4. **Plan → kesit** (Keşif): yön bulunmadan önce yalnızca plan vardır; parçalar oturdukça boyut kazanır.
5. **Ayağa kalkan tipografi** (perde kartları): dev kelime önce zemine yatık (sahnenin parçası),
   scroll ile ayağa kalkar.

## 5. Tipografi sahnenin parçası

- **Mimari etiketler** (annotation): 3D noktalara bağlı, çizgili (leader line) ince etiketler.
  Katman numarası, adı, davranışı; alan adları kümelerin yanında; disk dilimlerinde yetkinlik adları.
  Konumları her karede 3D'den ekrana izdüşürülür; kamera döndükçe yapıyla birlikte hareket ederler.
- Etiketler dekoratif kopyadır (`aria-hidden`); aynı bilgi sayfa metninde gerçek başlık/liste olarak vardır.

## 6. "Yaşayan sistem" mikro detayları

- Rastgele modüllerde kısa veri kıpırtıları (aktivite), sakin bölümlerde söner.
- Kamera sürüklenmesi (drift) bölümün enerjisine göre artar/azalır.
- Işık hattı, akış darbeleri ve katman davranışları zamanla sürer; scroll durduğunda sahne donmaz.

## 7. Sınırlar (değişmeyen kurallar)

- Scroll-jacking yok; kamera yalnızca scroll konumundan türetilir (saf fonksiyon: `choreography.ts`).
- Reduced motion: her bölüm tek, sabit kare (kamera dahil); drift ve davranışlar kapalı.
- Mobil: aynı kamera dili, daha az etiket (yalnızca aktif), daha az instance.
- WebGL yok: SVG yedek, aynı anlam.
- Kesin FPS iddiası yok; gerçek cihaz ölçümü ayrı adım.
