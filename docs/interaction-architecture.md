# Mouse etkileşim mimarisi · İterasyon 3: "Sahnenin içinde"

Korunanlar: palet, tipografi, kamera koreografisi (docs/motion-direction.md), scroll-jacking yok.
Eklenen: sahne artık yalnızca scroll'a değil, imlece de tepki verir. Ama oyuncak gibi değil:
her etkileşim bir **anlam** taşır (renk = katman, hover = "bunu fark ettim", tıklama = "buna yaklaş").

## 1. İki katmanlı model

| Katman | Ne | Nerede |
|---|---|---|
| **Ana deneyim** (büyük, anlatıyı taşır) | Hover ile keşif, tıkla-yaklaş (odak modu), sınırlı sürükleme | 3D sahne + odak paneli |
| **Mikro etkileşim** (küçük, rafine) | Özel imleç, hover künyesi, sol metin vurgusu, panel geçişleri, ipucu satırı | DOM (CSS + Motion for React) |

Arka plan tepkisi (parallax, kamera kayması) üçüncü bir şey değil, her ikisinin zemini: her zaman açık, çok hafif.

## 2. Hangi sahnede ne olur

| Bölüm | Hover | Tıklama | Sürükleme | Not |
|---|---|---|---|---|
| Hero | Modül ve katmanı fark eder (renk = katman künyesi) | — | — | Dağınık parçalar: "bu mavi parça Web'e ait" keşfi |
| Perde kartları | hafif | — | — | Dev tipografi baskın; sahne sakin |
| 01 Keşif | evet | — | evet | Plan görünümünde kısa tilt |
| 02 Merakın Peşinde | küme + bağları | **küme → odak** (alan) | evet | Sol listedeki alan düğmesiyle çift yönlü |
| 03 Üretim | evet | — | evet | Makro dalış sırasında tilt, minyatür sistemin içine bakış |
| 04 Bütünsel düşünme | katman | **katman → odak** | evet | Sol listedeki yetkinlik düğmesiyle çift yönlü |
| 05 Sorgulayıcı yaklaşım | katman | **katman → odak** | evet | Çekmece açıkken bile |
| 06 Çalışma biçimim | çok hafif | — | — | "Hareket neredeyse durur": özen = sakinlik |
| 07 Gelecek | dilim | **dilim → odak** | evet | Ortak diskin bir dilimine yaklaş |
| Kapanış | hafif | — | — | |

## 3. Mantık

### 3.1 Arka plan tepkisi (her zaman, ince)
- İmleç kamerayı azimutta ≤4° ve yükseklikte ≤2.3° kaydırır; kadraj (lens) birkaç piksel kayar.
- **Derinlik parallax'ı:** her katman imleç yönünde farklı miktarda kayar (üstteki fazla, alttaki az, ±0.18 birim).
- İmleç yakınındaki modüller kabarır ve hafifçe parlar ("bölge aktifleşir"); sakin bölümlerde (calm) azalır.

### 3.2 Hover: "fark etme"
- **Raycast yerine GPU seçimi (picking).** Modüllerin konumu GPU'da hesaplandığı için (kurulum animasyonu,
  katman davranışları, morph) CPU'daki klasik raycast gerçek konumu bilemez. Aynı vertex shader ile
  her modülü kimlik rengiyle 1×1 pikselde çizeriz (imlecin altındaki piksel) ve asenkron okuruz.
  Sonuç: ekranda **gerçekte görünen** modül, hangi durumda olursa olsun (exploded, disk, küme).
  Maliyet: ~50 ms'de bir, yalnızca imleç hareket ettiğinde, ekran görünürken.
- **Üç kademeli tepki:**
  1. *Modül:* hafif yükselir (0.14), %7 büyür, kenarı vurgu rengine döner.
  2. *Komşular:* hover noktasına yakın modüller (aynı katmanda) yumuşakça kabarır ve parlar.
  3. *Katman:* tümü çok hafif öne çıkar (aktif katmanın hafif sürümü).
- **Editorial künye** (tooltip değil): imlece bağlı ince kılavuz çizgi, numara + ad + davranış satırı,
  tıklanabilirse "yaklaş →". Sağ kenarda sola döner.
- **Sol metin vurgusu:** sol listedeki ilgili yetkinlik/alan satırı ink rengine döner.

### 3.3 Tıkla-yaklaş: odak modu
- Tıklanan katman/küme/dilim için kamera hedefi o alana kayar ve yaklaşır (GSAP'ye değil, mevcut kamera
  yumuşatmasına bağlı: aynı uniform'u iki sistem sürmez), geri kalan her şey x-ray'e geçer.
- Katman odağında **çekmece açılır** (iç yapı görünür) + blueprint karışımı + o katmanın davranış dili çalışır.
- **İçerik paneli** (alt solda, Motion for React ile) o alana göre güncellenir: numara, ad (kinetik ağırlık),
  açıklama, davranış, önceki/sonraki ve "← Bütüne dön".
- Çıkış (hepsi eşdeğer): **Esc**, Kapat düğmesi, arka plana tıklama, ~yarım ekran scroll.
  Kullanıcı hiçbir zaman sıkışmaz; scroll kilitlenmez.
- Klavye: sol listedeki yetkinlik ve alan düğmeleri (gerçek `<button>`) aynı odağı açar; panel başlığına
  odak taşınır, kapatınca tetikleyiciye döner.

### 3.4 Özel imleç (yalnızca ince imleç, hareket tercihi serbestse)
Tek bir nokta + ince halka; halka GSAP `quickTo` ile gecikmeli izler (konum yalnızca GSAP'de),
görünüm değişimleri CSS + Motion (ayrı elemanlar: aynı özelliği iki kütüphane sürmez).

| Hâl | Ne zaman | Görünüm |
|---|---|---|
| normal | Sahne arka planı, nesne yok | Nokta + küçük halka |
| hover | Bağlantı / düğme | Halka büyür, nokta kaybolur |
| explore | Tıklanamaz nesnenin üstünde | Halka dolgusu hafif, etiket "keşfet" |
| open | Tıklanabilir nesnenin üstünde | Vurgu rengi halka, etiket "aç" |
| drag | Sürüklerken | Halka yatay oval, etiket "sürükle" |
| close | Odak modunda arka plan | Halka içinde ×, etiket "kapat" |

Metin kartlarının üstünde ve form alanlarında özel imleç gizlenir (yerel imleç, metin seçimi bozulmaz).

### 3.5 Kontrollü sürükleme
- Tam orbit yok. Sürükleme azimutta ±21° ve yükseklikte ±7° tilt verir; bırakınca ~1 sn'de yaylanarak döner.
- 6 pikselden kısa hareket = tıklama (sürükleme sayılmaz).
- Dokunmatikte yalnızca **yatay** sürükleme tilt verir (`touch-action: pan-y`): dikey scroll asla bozulmaz.

## 4. Masaüstü ve mobil ayrımı

| | Masaüstü (ince imleç) | Mobil / dokunmatik |
|---|---|---|
| Hover | Sürekli seçim, künye imleçte | Dokun = seç (künye çıkar); aynı yere tekrar dokun = aç |
| Parallax | İmleçle | Yok (pil, jiroskop izni yok) |
| İmleç | Özel imleç | Yok |
| Sürükleme | Her yönde sınırlı tilt | Yalnızca yatay, sınırlı |
| Odak paneli | Sol altta kart | Altta sayfa (bottom sheet), büyük dokunma hedefleri |
| Kapatma | Esc / × / arka plan / scroll | × / arka plana dokun / scroll |

## 5. Erişilebilirlik, hareket tercihi, performans
- `prefers-reduced-motion`: parallax, sürükleme, özel imleç ve yaylanma kapalı. Odak modu çalışır ama geçişsiz (tek kare).
- Fare olmadan her şey erişilebilir: odak modu düğmelerle, Esc ile kapanır; paneldeki metin gerçek DOM.
- Etiket ve künyeler dekoratif kopyadır (`aria-hidden`); aynı bilgi sayfa metninde gerçek başlık/liste.
- Picking: yalnızca ince imleçte sürekli; bir istek sürerken yenisi başlamaz; sekme gizliyken çalışmaz.
- Etkileşim katmanı (Motion for React, özel imleç, panel) ilk JS paketine girmez: ayrı lazy chunk.

## 6. Teknoloji notu
React Three Fiber kullanılmıyor (neden: docs/creative-direction.md §9). R3F'in sunduğu olay sistemi CPU raycast'ine
dayanır; bu sahnede konumlar GPU'da olduğundan GPU seçimi hem daha doğru hem R3F'siz mümkün.
GSAP: kamera dışındaki sayfa animasyonları, imleç konumu (`quickTo`). Motion for React: panel ve imleç etiketi geçişleri.
