import type { Metadata } from "next";
import { PROFILE } from "./profile";
import { CAPABILITIES } from "./expertise";

// Yayına hazır metadata ve yapılandırılmış veri. İşveren/müşteri (worksFor) ve sayısal iddia YOK.

export const HOME_META: Metadata = {
  title: `${PROFILE.name} · ${PROFILE.title}`,
  description:
    "Merakla öğreniyor, özenle geliştiriyorum. Mobil, web, backend ve altyapı katmanlarında yazılım geliştiriyorum.",
};

export const ABOUT_META: Metadata = {
  title: `Hakkımda · ${PROFILE.name}`,
  description:
    "Yazılıma nasıl başladığım, nasıl çalıştığım, kodun ötesindeki ilgi alanlarım ve geleceğe dair hedeflerim.",
};

export const WRITING_META: Metadata = {
  title: `Yazılar · ${PROFILE.name}`,
  description: "Teknik makaleler, araştırma notları ve öğrendiklerim üzerine yazılar.",
};

export const CONTACT_META: Metadata = {
  title: `İletişim · ${PROFILE.name}`,
  description: "İş birliği yaklaşımım ve iletişim kanallarım.",
};

/** Yazı için Article verisi. Başlık ve özet yazının kendisinden gelir; ek iddia eklenmez. */
export function articleJsonLd(post: { title: string; summary: string; createdAt: string; updatedAt: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    url: post.url,
    inLanguage: "tr",
    author: { "@type": "Person", name: PROFILE.name, jobTitle: PROFILE.title, url: PROFILE.url },
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PROFILE.name,
    jobTitle: PROFILE.title,
    url: PROFILE.url,
    // Yalnızca doğrulanmış teknik yetkinlikler; ilgi alanları (felsefe vb.) uzmanlık gibi listelenmez.
    knowsAbout: CAPABILITIES.map((c) => c.labelEn),
  };
}
