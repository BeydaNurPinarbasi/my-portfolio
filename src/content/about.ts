import type { AboutSection } from "./types";
import { ROUTES } from "./routes";

// Hakkımda: hikâyenin DERİNLİĞİ. Ana sayfadaki özet cümleler burada tekrarlanmaz.
// Kişisel ama özel hayat ayrıntısı yok; deneyim süresi, sayı veya şirket adı yok.

export const ABOUT_INTRO = {
  title: "Hakkımda",
  lead:
    "Kendimi bilgiye karşı güçlü bir merakı olan biri olarak tanımlıyorum. Yazılım, bu merakı besleyen ve onu somut bir şeye dönüştürebildiğim alan.",
};

export const ABOUT_SECTIONS: readonly AboutSection[] = [
  {
    id: "origin",
    pillar: "merak",
    title: "Başlangıç",
    paragraphs: [
      "Hangi mesleği yapmak istediğimi bulmam zaman aldı. Farklı alanlarda çalıştım, denedim, aradım.",
      "Yazılımla ilk kez üniversitedeki derslerde karşılaştım. Asıl dönüm noktası ise ilk profesyonel yazılım şirketi deneyimim oldu: o noktadan sonra yazılım, işimden öte hayatımın merkezine yerleşti.",
    ],
  },
  {
    id: "drive",
    pillar: "merak",
    title: "Beni heyecanlandıranlar",
    paragraphs: ["Yazılımda beni hâlâ en çok heyecanlandıran şeyler:"],
    list: [
      "Sıfırdan özgün bir ürün ortaya çıkarmak",
      "Bir fikri çalışan bir sisteme dönüştürmek",
      "Sürekli araştırma yapabilmek",
      "Yeni şeyler öğrenmek",
      "Teknik bilgimi ve bakış açımı geliştirmek",
    ],
  },
  {
    id: "beyond",
    pillar: "merak",
    title: "Merakın Peşinde",
    paragraphs: [
      "Kod yazmak, ilgi alanlarımın yalnızca bir parçası. Yapay zekâ, felsefe, sosyal bilimler, insan davranışları ve dijital dönüşüm üzerine okuyor ve araştırıyorum.",
      "Bu alanlar bana teknolojiye farklı açılardan bakmayı öğretiyor. Bir alanda sorduğum soru, çoğu zaman başka bir alanda cevabını buluyor.",
    ],
  },
  {
    id: "sharing",
    pillar: "merak",
    title: "Öğrenmek ve paylaşmak",
    paragraphs: [
      "Öğrenmeyi bir dönemle sınırlı görmüyorum; araştırmak işin doğal bir parçası.",
      "Teknik deneyimlerimi makalelere, araştırma notlarına ve öğretici içeriklere dönüştürmek istiyorum. Yazılar bölümü bu niyetin başladığı yer.",
    ],
    link: { label: "Yazılara git", href: ROUTES.writing },
  },
  {
    id: "holistic",
    pillar: "uretim",
    title: "Bütünsel düşünme",
    paragraphs: [
      "Bir sistemi yalnızca frontend ya da backend olarak düşünmüyorum. Verinin nereden gelip nereye aktığına, mimarinin nasıl büyüyeceğine, güvenliğe, performansa ve uzun vadede sürdürülebilirliğe birlikte bakıyorum.",
      "Mobil, web, backend, veritabanı, altyapı, güvenlik ve otomasyon tarafında çalışmam da bu bakışı besliyor.",
    ],
  },
  {
    id: "inquiry",
    pillar: "uretim",
    title: "Sorgulayıcı yaklaşım",
    paragraphs: [
      "Bir teknik tercihi yaparken gerekçesini açıklayabilmeyi önemsiyorum. Neden bu yolu seçtiğimizi, hangi riskleri getirdiğini ve masada başka hangi seçeneklerin olduğunu birlikte değerlendirmeye çalışıyorum.",
    ],
  },
  {
    id: "approach",
    pillar: "sorumluluk",
    title: "Çalışma biçimim",
    paragraphs: [
      "Mümkün olduğunca çok proje üstlenmek benim için öncelik değil. Butik ve seçici çalışmayı tercih ediyorum; böylece üstlendiğim her işe gereken özeni gösterebiliyorum.",
      "İhtiyaçları detaylı anlamak, kapsamlı düşünmek, sorumluluk almak ve işimin arkasında durmak bu yaklaşımın parçaları.",
    ],
  },
  {
    id: "values",
    pillar: "sorumluluk",
    title: "İş ilişkilerinde önem verdiklerim",
    paragraphs: [
      "İş ilişkilerinde güven, sadakat, açıklık, adalet, sorumluluk, dengeli iletişim ve uzun vadeli iş birliği benim için belirleyici.",
      "Bu değerler, uzun yıllar devam eden profesyonel ilişkiler kurmamı sağladı.",
    ],
  },
  {
    id: "future",
    pillar: "sorumluluk",
    title: "Gelecek",
    paragraphs: [
      "Kendi yazılım ürünlerimi geliştirmek istiyorum. Uzun vadede ticari üretimin bağımsız araştırmalarımı destekleyebileceği bir yapı kurmayı ve zamanla kendi şirketimi büyütmeyi hedefliyorum.",
      "Ölçüt yalnızca büyüme değil: birlikte çalıştığım insanların emeğine değer verilen, adil, karşılıklı saygıya dayalı ve güvenilir bir çalışma kültürü kurmak istiyorum.",
    ],
    note: "Bunlar henüz gerçekleşmiş şeyler değil; yönümü belirleyen hedefler.",
  },
];
