// Hikâye koreografisi: SAF fonksiyonlar. DOM, GSAP veya Three bilmez.
//
// Konum (pos) = bölüm indeksi + bölüm içi ilerleme (0..1). StoryStage bunu ScrollTrigger'dan okur,
// stateAt(pos) sahnenin hedef durumunu verir. Tek kaynak olduğu için aynı uniform'u iki tween sürmez.
//
// Her bölümün 3D anlamı (bkz. docs/story-architecture.md §2):
//   hero       parçalar havada süzülür         -> henüz yolu bulunmamış merak
//   discovery  parçalar katmanlara oturur       -> yazılımda kendini bulmak
//   beyond     katmanlar alan kümelerine dağılır -> bilgi alanlarının ilişkisi
//   creation   sıkı yapı + yukarı akan ışık     -> fikir çalışan sisteme dönüşür
//   layers     ayrış, tek tek aktifleş, birleş  -> parçalar ve bütün
//   inquiry    bir katman kalkar, diğerleri sönükleşir -> bir tercihi yerinden çıkarıp incelemek
//   approach   sakin, kenarda, ışık yavaş       -> kontrollü, özenli çalışma
//   vision     beş katman tek diskte eşit dilim -> ortak, dengeli yapı

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
  yaw: 0.5,
  lift: 1,
  zoom: 1.4,
  shiftX: 0.32,
};

type Stop = [SectionId, number, Partial<SceneState>];

// Durak listesi: belirtilmeyen değerler bir önceki duraktan taşınır. Duraklar arası yumuşak geçiş.
const STOPS: Stop[] = [
  ["hero", 0, {}],
  ["act-merak", 0.2, { assemble: 0.3 }],
  ["discovery", 0.1, { assemble: 0.36 }],
  ["discovery", 0.85, { assemble: 1, explode: 0.22, yaw: 1.0, zoom: 1.05 }],
  ["beyond", 0.25, { field: 1, explode: 0, yaw: 1.5, zoom: 1.3, lift: 1.6, shiftX: 0.44 }],
  ["beyond", 0.85, { field: 1, yaw: 2.0 }],
  ["act-uretim", 0.6, { field: 0, compact: 0.6, lift: 1, shiftX: 0.32 }],
  ["creation", 0.3, { compact: 1, flow: 1, yaw: 2.4, zoom: 1.08 }],
  ["creation", 0.9, { compact: 1, flow: 1, yaw: 2.6 }],
  ["layers", 0.12, { compact: 0, flow: 0, explode: 1, yaw: 2.8 }],
  ["layers", 0.78, { explode: 1, yaw: 3.1 }],
  ["layers", 0.97, { explode: 0.08, flow: 0.8 }],
  ["inquiry", 0.25, { inspect: 1, explode: 0.3, flow: 0, zoom: 1.08, yaw: 3.25 }],
  ["inquiry", 0.85, { inspect: 1, yaw: 3.4 }],
  ["act-sorumluluk", 0.5, { inspect: 0, explode: 0.15, calm: 0.5 }],
  ["approach", 0.3, { calm: 1, zoom: 1.3, shiftX: 0.55, yaw: 3.55 }],
  ["approach", 0.9, { calm: 1, yaw: 3.65 }],
  ["vision", 0.35, { form: 1, explode: 0, lift: 3.6, calm: 0.6, zoom: 1.38, shiftX: 0.44 }],
  ["vision", 0.9, { form: 1, yaw: 4.3 }],
  ["work", 0.6, { zoom: 1.55, shiftX: 0.6, calm: 0.8 }],
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

/** Reduced motion: her bölüm için tek, sabit kompozisyon (bölümün "tutulan" anı). */
export function holdStateFor(index: number): SceneState {
  const id = SECTION_ORDER[index];
  return stateAt(index + (id === "layers" ? 0.97 : 0.6));
}

export const INITIAL_STATE: SceneState = stateAt(0);
