// Hikâye koreografisi: SAF fonksiyonlar. DOM, GSAP veya Three bilmez.
//
// Konum (pos) = bölüm indeksi + bölüm içi ilerleme (0..1). StoryStage bunu scroll'dan okur,
// stateAt(pos) sahnenin hedef durumunu (yapı + kamera) verir. Tek kaynak: aynı uniform'u iki tween sürmez.
//
// Anlatı döngüsü (docs/motion-direction.md): Bütün -> Detay -> Anlam -> Bütün.
//   hero       kuruluş planı, nefes alan kamera      -> henüz yolu bulunmamış merak
//   perde      dolly zoom, mekân esner               -> perde geçişi
//   discovery  plan (tepeden) -> kesit (perspektif)  -> yazılımda kendini bulmak
//   beyond     kümeler etrafında yörünge             -> bilgi alanlarının ilişkisi
//   creation   makro dalış, modülün içinde sistem    -> fikir çalışan sisteme dönüşür
//   layers     exploded view, x-ray, katman uçuşu    -> parçalar ve bütün
//   inquiry    uzun lens, blueprint, ölçü etiketleri -> bir tercihi çizim masasında incelemek
//   approach   sabit uzun lens, sakin                -> kontrollü, özenli çalışma
//   vision     vinç, tepeden ortak disk              -> ortak, dengeli yapı

import type { SceneState } from "@/components/immersive/scene/createStoryScene";
import type { PillarId } from "@/content/types";
import type { GlyphVariant } from "./StoryGlyph";

export type SectionId =
  | "hero"
  | "act-merak"
  | "discovery"
  | "beyond"
  | "act-uretim"
  | "creation"
  | "layers"
  | "inquiry"
  | "act-sorumluluk"
  | "approach"
  | "vision"
  | "work"
  | "contact";

/** DOM sırası. Sayfa bölümleri bu diziden üretilir; sıra değişirse koreografi de birlikte değişir. */
export const SECTION_ORDER: readonly SectionId[] = [
  "hero",
  "act-merak",
  "discovery",
  "beyond",
  "act-uretim",
  "creation",
  "layers",
  "inquiry",
  "act-sorumluluk",
  "approach",
  "vision",
  "work",
  "contact",
];

export const SECTION_PILLAR: Record<SectionId, PillarId | null> = {
  hero: null,
  "act-merak": "merak",
  discovery: "merak",
  beyond: "merak",
  "act-uretim": "uretim",
  creation: "uretim",
  layers: "uretim",
  inquiry: "uretim",
  "act-sorumluluk": "sorumluluk",
  approach: "sorumluluk",
  vision: "sorumluluk",
  work: null,
  contact: null,
};

/** WebGL yokken her bölümde gösterilen statik SVG biçimi (3D'deki biçimle aynı anlam). */
export const GLYPH_FOR: Record<SectionId, GlyphVariant> = {
  hero: "scatter",
  "act-merak": "scatter",
  discovery: "stack",
  beyond: "field",
  "act-uretim": "compact",
  creation: "compact",
  layers: "layers",
  inquiry: "inspect",
  "act-sorumluluk": "calm",
  approach: "calm",
  vision: "disc",
  work: "disc",
  contact: "disc",
};

const BASE: SceneState = {
  assemble: 0.22,
  compact: 0,
  explode: 0.15,
  field: 0,
  form: 0,
  flow: 0,
  inspect: 0,
  calm: 0,
  active: -3,
  behave: 0,
  xray: 0,
  blueprint: 0,
  nest: 0,
  yaw: 0.5,
  camAz: 0,
  camEl: 0.26,
  camDist: 1.45,
  fov: 32,
  tx: 0,
  ty: 0,
  tz: 0,
  follow: 0,
  frame: 1,
  drift: 1,
};

type Stop = [SectionId, number, Partial<SceneState>];

// Durak listesi: belirtilmeyen değerler bir önceki duraktan taşınır. Duraklar arası yumuşak geçiş.
// Kamera: camEl ~0.26 göz hizasına yakın, ~1.4 tepeden plan; camDist < 0.3 makro; fov < 22 uzun lens.
const STOPS: Stop[] = [
  // Hero: kuruluş planı, parçalar süzülüyor, kamera nefes alıyor.
  ["hero", 0, {}],
  // Perde I: dolly zoom — FOV açılırken kamera alçalıp yaklaşır, zemin esner.
  ["act-merak", 0.15, { assemble: 0.28 }],
  ["act-merak", 0.85, { fov: 58, camDist: 0.75, camEl: 0.12, drift: 0.4, assemble: 0.3 }],
  // 01 Keşif: önce vaziyet planı (tepeden, blueprint), parçalar oturdukça perspektife yatar.
  ["discovery", 0.05, { fov: 30, camEl: 1.42, camDist: 1.55, blueprint: 0.7, assemble: 0.36, drift: 0.2 }],
  ["discovery", 0.85, { assemble: 1, explode: 0.22, camEl: 0.38, camDist: 1.15, blueprint: 0, yaw: 1.0, drift: 0.6 }],
  // 02 Merakın Peşinde: kümeler etrafında yavaş yörünge.
  ["beyond", 0.25, { field: 1, explode: 0, yaw: 1.5, camEl: 0.55, camDist: 1.55, fov: 34, frame: 0.65, drift: 0.5 }],
  ["beyond", 0.85, { yaw: 2.1, camAz: 0.35 }],
  // Perde II: yine dolly zoom; kümeler toplanmaya başlar.
  ["act-uretim", 0.15, { fov: 34 }],
  ["act-uretim", 0.75, { field: 0, compact: 0.6, fov: 56, camDist: 0.8, camEl: 0.15, camAz: 0, frame: 1 }],
  // 03 Üretim: çalışan sistem -> makro dalış -> modülün içinde bütün sistem -> geri çekilme.
  ["creation", 0.1, { compact: 1, flow: 1, fov: 34, camDist: 1.1, camEl: 0.3, yaw: 2.4 }],
  ["creation", 0.55, { nest: 1, camDist: 0.16, camEl: 0.55, fov: 40, frame: 0.6, drift: 0.3 }],
  ["creation", 0.8, { camDist: 0.2, camAz: 0.25 }],
  // 04 Bütünsel düşünme: exploded view; kamera yığın boyunca iner, her katmanı yakın planda yakalar.
  ["layers", 0.05, { nest: 0, compact: 0, flow: 0, explode: 1, camDist: 1.2, camEl: 0.3, camAz: 0, fov: 32, frame: 1 }],
  ["layers", 0.14, { xray: 0.85, behave: 1, follow: 1, camDist: 0.82, camEl: 0.42, camAz: -0.35, fov: 36, frame: 0.85, yaw: 2.8 }],
  ["layers", 0.78, { camAz: 0.3, yaw: 3.0 }],
  // ...ve yeniden bütün: katmanlar birleşir, x-ray söner.
  ["layers", 0.94, { xray: 0, behave: 0, follow: 0, explode: 0.08, flow: 0.8, camDist: 1.25, camEl: 0.35, camAz: 0, frame: 1 }],
  // 05 Sorgulayıcı yaklaşım: uzun lens (düzleşen perspektif), teknik çizim, kalkan katman.
  // Kalkan katman raf çekmecesi gibi yana kayar; kamera yapı ile çekmece arasını kadrajlar (follow 0.5).
  ["inquiry", 0.2, { inspect: 1, explode: 0.3, flow: 0, blueprint: 1, follow: 0.5, fov: 18, camDist: 2.7, camEl: 0.5, camAz: 0.35, yaw: 3.25, frame: 0.55, drift: 0.15 }],
  ["inquiry", 0.85, { camAz: 0.7 }],
  // Perde III: blueprint söner, sistem sakinleşir.
  ["act-sorumluluk", 0.5, { inspect: 0, blueprint: 0, follow: 0, explode: 0.15, calm: 0.5, fov: 30, camDist: 1.4, camEl: 0.25, camAz: 0.2, drift: 0.1 }],
  // 06 Çalışma biçimim: sabit, uzun lens; hareket neredeyse durur.
  ["approach", 0.3, { calm: 1, fov: 20, camDist: 2.2, camEl: 0.22, frame: 1.1, yaw: 3.55, drift: 0.05 }],
  ["approach", 0.9, { yaw: 3.65 }],
  // 07 Gelecek: vinç — kamera tepeye yükselir, ortak disk planda okunur, sonra hafifçe iner.
  ["vision", 0.15, { fov: 34, camDist: 1.4 }],
  ["vision", 0.45, { form: 1, explode: 0, camEl: 1.3, camDist: 1.25, calm: 0.6, frame: 0.8, fov: 36, camAz: 0 }],
  ["vision", 0.9, { camEl: 0.85, yaw: 4.3 }],
  // Kapanış: geri çekilme, sistem yeniden bütün.
  ["work", 0.5, { camDist: 1.9, camEl: 0.45, frame: 1.2, calm: 0.8, drift: 0.3 }],
  ["contact", 0.5, { camEl: 0.3, camDist: 2.1 }],
];

const indexOf = (id: SectionId) => SECTION_ORDER.indexOf(id);

// Durakları mutlak konuma ve tam duruma çevir (bir kez, modül yüklenirken).
const RESOLVED: { pos: number; state: SceneState }[] = (() => {
  let carry = { ...BASE };
  return STOPS.map(([id, local, patch]) => {
    carry = { ...carry, ...patch };
    return { pos: indexOf(id) + local, state: { ...carry } };
  });
})();

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 04 Bütünsel düşünme: katmanların tek tek aktifleştiği aralık (bölüm içi). */
export const LAYERS_STEP = { from: 0.15, to: 0.75 } as const;
/** 05 Sorgulayıcı yaklaşım: yapıdan kalkıp incelenen katman (backend: servisler ve iş mantığı). */
export const INQUIRY_LAYER = 2;

/** Aktif katman (sürekli). Liste vurgusu ve 3D aynı fonksiyondan beslenir. */
export function activeLayerAt(pos: number, layerCount = 5): number {
  const li = indexOf("layers");
  if (pos >= li + LAYERS_STEP.from - 0.02 && pos < li + 0.9) {
    const t = (pos - li - LAYERS_STEP.from) / (LAYERS_STEP.to - LAYERS_STEP.from);
    return Math.min(layerCount - 1, Math.max(0, t * layerCount - 0.5));
  }
  const qi = indexOf("inquiry");
  if (pos >= qi + 0.1 && pos < qi + 1.2) return INQUIRY_LAYER;
  return -3;
}

export function stateAt(pos: number): SceneState {
  let out: SceneState;
  if (pos <= RESOLVED[0].pos) out = { ...RESOLVED[0].state };
  else if (pos >= RESOLVED[RESOLVED.length - 1].pos) out = { ...RESOLVED[RESOLVED.length - 1].state };
  else {
    let i = 0;
    while (RESOLVED[i + 1].pos < pos) i++;
    const a = RESOLVED[i];
    const b = RESOLVED[i + 1];
    const t = smooth((pos - a.pos) / (b.pos - a.pos));
    out = { ...a.state };
    for (const key of Object.keys(out) as (keyof SceneState)[]) {
      out[key] = a.state[key] + (b.state[key] - a.state[key]) * t;
    }
  }
  out.active = activeLayerAt(pos);
  return out;
}

/** Reduced motion: her bölüm için tek, sabit kompozisyon (bölümün "tutulan" anı). Drift yok. */
export function holdStateFor(index: number): SceneState {
  const id = SECTION_ORDER[index];
  return { ...stateAt(index + (id === "layers" ? 0.97 : 0.6)), drift: 0 };
}

/** Sahnedeki mimari etiket grubu (StoryStage hangi etiketlerin görüneceğine buradan karar verir). */
export type NoteGroup = "core" | "plan" | "domains" | "nest" | "layers" | "inquiry" | "sectors" | "micro";

export function noteGroupAt(pos: number): NoteGroup | null {
  const i = Math.floor(pos);
  const l = pos - i;
  switch (SECTION_ORDER[i]) {
    case "hero":
      return "core";
    case "act-merak":
      return l < 0.5 ? "core" : null;
    case "discovery":
      return l < 0.45 ? "plan" : null;
    case "beyond":
      return l > 0.15 ? "domains" : null;
    case "creation":
      return l > 0.45 && l < 0.92 ? "nest" : null;
    case "layers":
      return l > 0.12 && l < 0.9 ? "layers" : null;
    case "inquiry":
      return l > 0.15 ? "inquiry" : null;
    case "vision":
      return l > 0.4 ? "sectors" : null;
    default:
      return null;
  }
}

export const INITIAL_STATE: SceneState = stateAt(0);
