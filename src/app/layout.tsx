import React from "react";
import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import { PROFILE } from "@/content/profile";
import { THEMES } from "@/lib/design/palette";
import { THEME_STORAGE_KEY } from "@/lib/design/theme";
import "./styles/globals.css";
import "@/components/immersive/immersive.css";
import "@/components/story/story.css";
import "@/components/story/pages.css";

// Kök layout bir SUNUCU bileşenidir: public sayfalar kendi gezinme/altbilgisini (SiteNav) taşır.
// Eskiden burada istemci tarafı ThemeWrapper + PublicLayout (Navbar/Footer) vardı; yeni tasarımda
// kullanılmıyorlar. Tema bağlamı yalnızca admin panelinde (admin/layout.tsx).

const display = DM_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"], // wght variable olarak zaten gelir (kinetik ağırlık); opsz büyük boyutta sıkı form verir
  variable: "--font-display",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"], // DM Mono variable değil
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.url),
  title: { default: `${PROFILE.name} · ${PROFILE.title}`, template: `%s` },
  description: "Merakla öğreniyor, özenle geliştiriyorum.",
  openGraph: { type: "website", locale: "tr_TR", siteName: PROFILE.name },
  alternates: { canonical: "./" },
};

// Tarayıcı çubuğu rengi varsayılan (koyu) tema ile başlar; geçişte theme.ts bu etiketi günceller.
export const viewport: Viewport = { themeColor: THEMES.dark.bg };

// İlk boyamadan ÖNCE kayıtlı tema seçimini uygular (açık seçen ziyaretçi koyu parlamasın). Varsayılan: koyu.
const THEME_INIT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var l=t==="light";document.documentElement.dataset.theme=l?"light":"dark";if(l){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",${JSON.stringify(THEMES.light.bg)})}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="bg-background flex flex-col min-h-screen">{children}</body>
    </html>
  );
}
