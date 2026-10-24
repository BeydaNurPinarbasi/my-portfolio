// İletişim sayfası: iş birliği yaklaşımı ve kanallar.
// Yalnızca mevcut sitede zaten herkese açık olan kanallar listelenir. Kişisel sosyal medya
// (özel hayat) bilinçli olarak dahil edilmedi.

export const CONTACT_PAGE = {
  eyebrow: "İletişim",
  title: "Birlikte düşünelim.",
  approach: [
    "Seçici çalışıyorum; üstlendiğim işe gereken özeni gösterebilmek benim için sayıdan daha önemli.",
    "Bir iş birliğine başlamadan önce ihtiyacı detaylı anlamayı önemsiyorum. Ne yapmak istediğinizi, neden önemli olduğunu ve beklentilerinizi kısaca anlatırsanız, birlikte çalışmanın doğru olup olmadığını açıkça konuşabiliriz.",
    "Uzun vadeli, karşılıklı güvene dayalı iş birliklerine değer veriyorum.",
  ],
  channelsTitle: "Doğrudan ulaşmak için",
  formTitle: "Mesaj gönder",
  privacy: "Form, mesajınızı yalnızca e-posta olarak bana iletir; site mesajları herhangi bir veritabanında saklamaz.",
} as const;

export const CONTACT_EMAIL = "beydanur.pinarbasi@gmail.com";

export const CONTACT_CHANNELS: readonly { id: string; label: string; value: string; href: string; external: boolean }[] = [
  { id: "email", label: "E-posta", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
  {
    id: "linkedin",
    label: "LinkedIn",
    value: "Beyda Nur Pınarbaşı",
    href: "https://www.linkedin.com/in/beyda-nur-p%C4%B1narba%C5%9F%C4%B1/",
    external: true,
  },
];

/** Konu, mesajın başına eklenir (API'de ayrı alan yok; mevcut sözleşme değişmez). */
export const CONTACT_TOPICS = ["Proje / iş birliği", "Yazılar hakkında", "Diğer"] as const;

// /api/contact ile AYNI sınırlar (src/app/api/contact/route.ts). İstemci doğrulaması yalnızca
// kullanıcıya erken geri bildirim içindir; asıl kontrol sunucuda.
export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 } as const;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[0-9+()\-\s]{7,25}$/;
