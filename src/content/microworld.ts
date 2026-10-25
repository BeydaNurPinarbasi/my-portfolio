// Mikro dünya: Backend katmanında bir modülün içi. Tamamen GENEL ve ÖZGÜN bir teknik temsildir.
// Gerçek bir sistemin topolojisi, bir müşteri mimarisi ya da bir proje değildir (bkz. disclaimer).
// Metinler genel teknik kavram tanımlarıdır; "şunu yaptım" iddiası içermez.

import type { Tone } from "@/lib/design/palette";

export interface MicroService {
  id: "api" | "auth" | "logic" | "db";
  index: string; // sahnedeki etiket numarası
  label: string;
  role: string; // sahnedeki etiketin ikinci satırı
  concept: string; // tıklayınca açılan kısa açıklama
  points: readonly string[]; // açıklamanın altındaki üç anahtar kavram
  tone: Tone;
}

export const MICRO = {
  /** Mikro dünyanın bağlı olduğu katman (expertise.ts sırası: 2 = Backend). */
  layer: 2,
  title: "Bir modülün içi",
  kicker: "Backend · mikro dünya",
  disclaimer: "Genel ve özgün bir temsildir; gerçek bir sistemin topolojisi ya da bir müşteri mimarisi değildir.",
  intro: "Bir isteğin servis içinden geçişi: alttaki hat istekleri, üstteki yaylar yanıtları taşır.",
  enter: "Bir modülün içine gir",
  enterHint: "modüle tıkla · içine gir",
  back: "Katman detayına dön",
  legend: [
    { label: "İstek", text: "alt hat, aşağıdan yukarı akar" },
    { label: "Yanıt", text: "üst yay, geri döner" },
  ],
  services: [
    {
      id: "api",
      index: "01",
      label: "API",
      role: "giriş kapısı",
      concept:
        "Dış dünya ile servis arasındaki sözleşmedir: hangi isteğin, hangi biçimde ve hangi kurallarla kabul edileceğini tanımlar.",
      points: ["İstek ve yanıt biçimi", "Hata sözleşmesi", "Sürümleme"],
      tone: "sky",
    },
    {
      id: "auth",
      index: "02",
      label: "Kimlik doğrulama",
      role: "kontrol noktası",
      concept:
        "İsteği kimin yaptığını doğrular (kimlik) ve neye erişebileceğini belirler (yetki). Güvenlik sınırı burada çizilir.",
      points: ["Oturum ve token", "Yetkilendirme kuralları", "Sınırda doğrulama"],
      tone: "dusk",
    },
    {
      id: "logic",
      index: "03",
      label: "İş mantığı",
      role: "karar ve akış",
      concept:
        "İşin kurallarıdır: bir isteğin gerçekte ne anlama geldiği, hangi adımlardan geçeceği ve nasıl sonuçlanacağı burada kararlaştırılır.",
      points: ["Kurallar ve doğrulama", "İş akışı adımları", "Tutarlı sonuçlar"],
      tone: "sage",
    },
    {
      id: "db",
      index: "04",
      label: "Veritabanı",
      role: "kalıcı durum",
      concept:
        "Sistemin hafızasıdır: verinin nasıl modelleneceği, saklanacağı ve tutarlı kalacağı burada belirlenir.",
      points: ["Veri modeli", "Tutarlılık", "Yedekleme ve geri dönüş"],
      tone: "slate",
    },
  ] as readonly MicroService[],
} as const;
