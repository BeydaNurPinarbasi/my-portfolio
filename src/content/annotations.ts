// Sahnedeki mimari etiketler (3D noktalara bağlı, kamera döndükçe yapıyla birlikte hareket eder).
// Dekoratif kopya: aynı bilgi sayfa metninde gerçek başlık/liste olarak var (etiketler aria-hidden).
// Kural: etiketler yalnızca sahnenin kendisini ve doğrulanmış içeriği anlatır; yeni iddia eklemez.

import type { NoteGroup } from "@/components/story/choreography";
import { CAPABILITIES } from "./expertise";
import { DOMAINS } from "./domains";
import { INQUIRY_QUESTIONS } from "./home";
import { MICRO } from "./microworld";

export interface SceneNote {
  id: string;
  anchor: string; // createStoryScene.anchors() anahtarı
  group: NoteGroup;
  index?: string;
  title: string;
  detail?: string;
  layer?: number; // katman etiketleri: aktif olan genişler
}

export const SCENE_NOTES: readonly SceneNote[] = [
  // Hero: sahnenin kendi künyesi (modül sayısı istemcide gerçek değerle doldurulur).
  { id: "core", anchor: "core", group: "core", index: "STRATA", title: "5 katman", detail: "{modules} modül" },
  // Keşif: vaziyet planı anı.
  { id: "plan", anchor: "core", group: "plan", index: "PLAN", title: "Vaziyet planı", detail: "plan → kesit" },
  // Merakın Peşinde: alan adları kümelerin yanında.
  ...DOMAINS.map((d) => ({ id: `domain-${d.id}`, anchor: `domain${d.layer}`, group: "domains" as const, title: d.label })),
  // Üretim: sahne içinde sahne.
  { id: "nest", anchor: "nest", group: "nest", index: "01·M", title: "Bir modülün içinde", detail: "bütün sistem" },
  // Bütünsel düşünme: katman künyeleri; aktif olan davranış dilini gösterir.
  ...CAPABILITIES.map((c, i) => ({
    id: `layer-${c.id}`,
    anchor: `layer${i}`,
    group: "layers" as const,
    index: c.index,
    title: c.label,
    detail: c.behavior,
    layer: i,
  })),
  // Sorgulayıcı yaklaşım: kalkan katmanın köşelerine bağlı ölçü etiketleri.
  ...INQUIRY_QUESTIONS.map((q, i) => ({
    id: `inq-${i}`,
    anchor: `corner${i}`,
    group: "inquiry" as const,
    index: String.fromCharCode(65 + i),
    title: q.label,
  })),
  // Mikro dünya (Backend): servis etiketleri. Hover/seçimde etiket genişler (layer = servis indeksi).
  ...MICRO.services.map((m, i) => ({
    id: `svc-${m.id}`,
    anchor: `svc${i}`,
    group: "micro" as const,
    index: m.index,
    title: m.label,
    detail: m.role,
    layer: i,
  })),
  // Gelecek: ortak diskin dilimleri.
  ...CAPABILITIES.map((c, i) => ({ id: `sector-${c.id}`, anchor: `sector${i}`, group: "sectors" as const, index: c.index, title: c.label })),
];
