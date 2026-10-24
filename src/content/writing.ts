// Yazılar sayfası metni. Bilgi paylaşımı bir HEDEF olarak tanımlı (traits.ts): sayfa, yazıların
// varlığını abartmaz; az sayıda yazı varken de dürüst okunur.

export const WRITING_PAGE = {
  title: "Yazılar",
  lead: "Teknik deneyimlerimi, araştırma notlarımı ve öğrendiklerimi yazıya dökmeye başladığım yer.",
  intentTitle: "Burada neler olacak",
  intent: "Zamanla bu alanda üç tür içerik biriktirmek istiyorum:",
  kinds: [
    { label: "Teknik makaleler", text: "Bir konuyu baştan sona, gerekçeleriyle anlatan yazılar." },
    { label: "Araştırma notları", text: "Yazılımın ötesindeki alanlarda okuduklarım ve sorularım." },
    { label: "Öğretici içerikler", text: "Bir şeyi adım adım öğrenmeye yardım eden rehberler." },
  ],
  empty: "Henüz yayınlanmış bir yazı yok.",
  readingSuffix: "dk okuma",
  toc: "Bu yazıda",
  back: "Tüm yazılar",
  next: "Sonraki yazı",
  prev: "Önceki yazı",
  discuss: {
    text: "Bu yazı hakkında düşüncelerini ya da bir sorunu paylaşmak istersen yazabilirsin.",
    label: "İletişime geç",
  },
} as const;
