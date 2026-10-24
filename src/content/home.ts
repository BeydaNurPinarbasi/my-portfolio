import type { Chapter, TextLink } from "./types";
import { ROUTES } from "./routes";

// Ana sayfa: hikâyenin ÖZETİ. Derin anlatım about.ts'te; metinler orada tekrarlanmaz.
// Dil: samimi ama profesyonel, iddiasız. Hedefler "istiyorum/hedefliyorum" ile yazılır.

export const HOME_HERO = {
  eyebrow: "Yazılım Geliştirici",
  title: "Merakla öğreniyor, özenle geliştiriyorum.",
  lead:
    "Bir fikrin çalışan bir ürüne dönüşmesini seviyorum. Mobil uygulamalardan web sistemlerine, backend geliştirmeden altyapıya kadar yazılımın farklı katmanlarında üretmeye devam ediyorum.",
};

export const HOME_CHAPTERS: readonly Chapter[] = [
  {
    id: "discovery",
    scene: "discovery",
    pillar: "merak",
    index: "01",
    eyebrow: "Keşif",
    title: "Yazılımda kendimi buldum.",
    body: [
      "Yazılımla üniversitedeki derslerde tanıştım. Öncesinde farklı alanlarda çalışıp ne yapmak istediğimi aradım.",
      "İlk yazılım şirketi deneyimimle birlikte yazılım, hayatımın merkezine yerleşti.",
    ],
  },
  {
    id: "beyond",
    scene: "beyond",
    pillar: "merak",
    index: "02",
    eyebrow: "Merakın Peşinde",
    title: "Kodun ötesindeki sorular.",
    body: [
      "Yazılımın yanında yapay zekâ, felsefe, sosyal bilimler, insan davranışları ve dijital dönüşüm üzerine okuyor, araştırıyorum.",
      "Alanlar birbirine bağlandıkça daha iyi sorular sorabiliyorum.",
    ],
    note: "Öğrendiklerimi makalelere, araştırma notlarına ve öğretici içeriklere dönüştürmek istiyorum.",
    link: { label: "Yazılar", href: ROUTES.writing },
  },
  {
    id: "creation",
    scene: "creation",
    pillar: "uretim",
    index: "03",
    eyebrow: "Üretim",
    title: "Bir fikri, çalışan bir sisteme dönüştürmek.",
    body: [
      "En çok sıfırdan özgün bir ürün ortaya çıkarmayı seviyorum.",
      "Bunu yaparken araştırıyor, yeni şeyler öğreniyor ve bakış açımı geliştiriyorum.",
    ],
  },
  {
    id: "layers",
    scene: "layers",
    pillar: "uretim",
    index: "04",
    eyebrow: "Bütünsel düşünme",
    title: "Tek bir katmana değil, sistemin bütününe bakıyorum.",
    body: [
      "Bir sistemi geliştirirken yalnızca arayüzü ya da sunucuyu değil; veri akışını, mimariyi, güvenliği, performansı ve sürdürülebilirliği birlikte düşünüyorum.",
    ],
  },
  {
    id: "inquiry",
    scene: "inquiry",
    pillar: "uretim",
    index: "05",
    eyebrow: "Sorgulayıcı yaklaşım",
    title: "Her teknik tercihin bir gerekçesi olmalı.",
    body: ["Bir karar vermeden önce üç soruyu birlikte değerlendirmeye önem veriyorum."],
  },
  {
    id: "approach",
    scene: "approach",
    pillar: "sorumluluk",
    index: "06",
    eyebrow: "Çalışma biçimim",
    title: "Butik, seçici ve özenli.",
    body: [
      "Her projeyi üstlenmek önceliğim değil. Üstlendiğim işe kendi işim gibi yaklaşıyor; ihtiyacı detaylı anlamaya, sorumluluk almaya ve işimin arkasında durmaya özen gösteriyorum.",
      "Bu yaklaşım, uzun soluklu iş ilişkileri kurmamı sağladı.",
    ],
  },
  {
    id: "vision",
    scene: "vision",
    pillar: "sorumluluk",
    index: "07",
    eyebrow: "Gelecek",
    title: "Kendi ürünlerimi geliştirmek istiyorum.",
    body: [
      "Uzun vadede ticari üretimin bağımsız araştırmalarımı destekleyebileceği bir yapı kurmayı ve zamanla kendi şirketimi büyütmeyi hedefliyorum.",
      "Bunu yaparken emeğe değer verilen, adil, saygılı ve güvenilir bir çalışma kültürü oluşturmak istiyorum.",
    ],
    note: "Bunlar bugünün başarıları değil; yönümü belirleyen hedefler.",
  },
];

/** Sorgulayıcı yaklaşım: her karar için üç soru. */
export const INQUIRY_QUESTIONS: readonly { label: string; question: string }[] = [
  { label: "Gerekçe", question: "Bu tercihi neden yapıyoruz?" },
  { label: "Risk", question: "Neyi riske atıyor, neyi zorlaştırıyor?" },
  { label: "Alternatif", question: "Başka hangi yollar var ve bedelleri ne?" },
];

export const HOME_WORK = {
  title: "Seçili çalışmalar",
  emptyNote:
    "Müşteri projelerim gizlilik sözleşmeleri kapsamında; bu yüzden burada yalnızca yayın izni olan çalışmalar ve müşterilerle ilişkilendirilemeyen kendi demo projelerim yer alacak.",
};

export const HOME_CONTACT: { title: string; body: string; primary: TextLink; secondary: TextLink } = {
  title: "Birlikte düşünelim.",
  body: "Özenle ele alınacak, uzun soluklu bir iş birliği arıyorsanız tanışmak isterim.",
  primary: { label: "İletişime geç", href: ROUTES.contact },
  secondary: { label: "Hakkımda daha fazlası", href: ROUTES.about },
};
