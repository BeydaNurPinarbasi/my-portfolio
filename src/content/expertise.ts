// Doğrulanmış yetkinlik verisi (bkz. docs/creative-direction.md §10). Sıra = 3D katman sırası.
// Yalnızca genel yetkinlik açıklamaları: müşteri/şirket/proje adı, sayısal iddia YOK.
// Yeni bir madde eklemeden önce içeriğin doğrulandığından emin olun.

import type { Tone } from "@/lib/design/palette";

export interface Capability {
  id: string;
  index: string;
  label: string;
  labelEn: string;
  description: string;
  tone: Tone; // kategori rengi: 3D katman ve liste aynı tonu kullanır (sıra = katman sırası)
}

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "mobile",
    index: "01",
    label: "Mobil",
    labelEn: "Mobile Development",
    description: "React Native ile iOS ve Android uygulamaları.",
    tone: "blush",
  },
  {
    id: "web",
    index: "02",
    label: "Web",
    labelEn: "Web Development",
    description: "React, Next.js ve TypeScript ile web uygulamaları.",
    tone: "sky",
  },
  {
    id: "backend",
    index: "03",
    label: "Backend",
    labelEn: "Backend Development",
    description: "API tasarımı, servisler ve iş mantığı.",
    tone: "sage",
  },
  {
    id: "data",
    index: "04",
    label: "Veri & Altyapı",
    labelEn: "Database & Infrastructure",
    description: "Veritabanı modelleme, sunucu ve deployment süreçleri.",
    tone: "dusk",
  },
  {
    id: "security",
    index: "05",
    label: "Güvenlik & Otomasyon",
    labelEn: "Security & Automation",
    description: "Kimlik doğrulama, yetkilendirme ve süreç otomasyonu.",
    tone: "slate",
  },
] as const;

// Bütünsel düşünme: bir sistemi geliştirirken her katmanı kesen konular.
export const CONCERNS: readonly string[] = ["Veri akışı", "Mimari", "Güvenlik", "Performans", "Sürdürülebilirlik"];
