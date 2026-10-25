# Hakkımda · Neoklasik galeri (/about)

Canlı rota `/about`. Açık, siteye uygun atmosfer (krem zemin, paletin pastel duvar alanları, midnight metin). Önceki soyut heykel, nokta bulutu ve koyu galeri denemeleri kaldırıldı.

Hakkımda metinleri (`src/content/about.ts`) DEĞİŞTİRİLMEDİ. Her bölüm bir kamera istasyonudur (istasyon id'si = bölüm id'si) ve panelde olduğu gibi okunur; aynı metin sahne altında düz HTML olarak da vardır (SEO, erişilebilirlik, WebGL/JS yokken okuma).

## İstasyonlar (bölüm → kamera)
Merak: Başlangıç → yüz · Beni heyecanlandıranlar → saç · Merakın Peşinde → Barok kabartma (+ alan soruları) · Öğrenmek ve paylaşmak → profil. Üretim: Bütünsel düşünme → sütun boyu (+ kesen konular) · Sorgulayıcı yaklaşım → Korint başlığı. Sorumluluk: Çalışma biçimim → kumaş/omuz · İş ilişkilerinde önem verdiklerim → kaide · Gelecek → geri çekilme, hedef notu.

## Sahne
- **Büst:** gerçek 3D model (Poly Haven "Marble Bust 01", Rico Cilliers, CC0). Lisans doğrulandı: `public/models/marble-bust/LICENSE.md`. 17k üçgen, normal haritasıyla yüz/saç ayrıntısı. Dokular 4k ve 2k WebP (2k ile açılır, geniş ekranda 4k boşta yüklenir).
- **Korint sütunu, kaide, Barok kabartma:** özgün, procedural. Sütun: 24 yivli ve entasisli gövde, attik kaide, akantus yaprakları, köşe volütleri, içbükey abaküs. Kabartma: yükseklik haritasından (sarmal akantus, boncuk silme, yumurta-ok bandı, palmet) 360×450 ızgaralı gerçek geometri kabartması + normal haritası. Taş: Carrara, fildişi, kireçtaşı, traverten; ridged-noise damar, tane, gözenek, roughness ve normal haritası.
- **Işık:** sıcak ana ışık (statik 4096 gölge haritası, bir kez üretilir), serin kenar ışığı, çok düşük ortam. ACES tone mapping.
- **Dijital katman (palet yalnızca burada):** ince halkalar, yüzen parçalar, imleç ışığı (parçaya göre pastel), bilgi işaretleri (halkalı nokta + künye), seçili alan göstergesi.

## Etkileşim
- GSAP koreografisi: genel görünüm ⇄ 9 istasyon; perde rayı (I Merak, II Üretim, III Sorumluluk) ile atlama. İstasyondan istasyona geçişte önce geri çekilir (dolly out), sonra yaklaşır. Esc, "Galeriye dön", ok tuşları, işaret düğmeleri, sahnede tıklama (büst → yüz, sütun → başlık, panel → kabartma).
- Fare: ince kamera kayması, hover'da yüzeye pastel ışık; sınırlı sürükleme (±31° yatay, ±12° dikey), istasyon değişince yumuşakça sıfırlanır.
- Mobil: dokun = yaklaş, işaretler gerçek düğme, alt sayfa panel; dikey kaydırma sayfaya kalır. Reduced motion: kamera anında geçer, kayma yok. WebGL yok: başlık ve metin.

## Dürüst sınırlar
- Tam boy figür yok: lisanslı, kaliteli, tam boy neoklasik figür bulunamadı (Poly Haven'da yalnızca bu büst ve gotik bir heykel var). Sketchfab/Smithsonian gibi kaynaklar giriş ya da lisans ayrıntısı gerektirir; indirilip doğrulanmadan eklenmedi. İlk sahne için büst yeterli (yüz ve saç yakın planı).
- Sütun başlığındaki akantus yaprakları procedural: ana hatlar doğru ama fotogrametri kalitesinde değil (yapraklar biraz ince ve keskin). Sonraki adım: lisanslı bir Korint başlığı taraması bulunursa değiştirmek.
- Draco/Meshopt uygulanmadı: büst geometrisi zaten 416 KB; sıkıştırmanın kazancı küçük, kod/ek decoder maliyeti var. Doku LOD (2k → 4k) uygulandı. Mesh LOD yok.
- Gerçek telefonda ölçülmedi.

## Ölçüm (Apple M3, retina, dev sunucu)
Genel görünüm, geçiş ve yüz yakın planında 60 fps vsync (kare 16,6 ms, p95 16,8). Gölge haritası statik olmasaydı p95 33 ms'ydi (4096 gölge + ~160k köşe), bu yüzden statik üretildi.
