// Etkileşim kuralları: SAF fonksiyonlar. DOM, GSAP veya Three bilmez.
// Neyin nerede açık olduğu docs/interaction-architecture.md §2'deki tablonun kodudur.

import type { SceneState } from "@/components/immersive/scene/createStoryScene";
import { FIELD_NODES, sectorPoint } from "@/components/immersive/scene/layers";
import { SECTION_ORDER, type SectionId } from "./choreography";

/** Tıklanabilir yapı türü: hangi sahne biçimine ait olduğunu belirler. */
export type ClickKind = "layer" | "domain" | "sector";

export interface Interaction {
  /** 3D'de imleçle keşif (hover) açık mı */
  hover: boolean;
  /** Tıklayınca odak modu açılıyor mu, hangi türde */
  click: ClickKind | null;
  /** Sınırlı sürükleme (tilt) açık mı */
  drag: boolean;
  /** HUD'daki ipucu satırı */
  hint: string;
}

const NONE: Interaction = { hover: false, click: null, drag: false, hint: "" };

const TABLE: Partial<Record<SectionId, Interaction>> = {
  hero: { hover: true, click: null, drag: false, hint: "fareyle gez · parçaları keşfet" },
  // Perde kartları: dev tipografi baskın, sahne sakin. Hover çok hafif, tıklama ve sürükleme yok.
  "act-merak": { hover: true, click: null, drag: false, hint: "" },
  "act-uretim": { hover: true, click: null, drag: false, hint: "" },
  "act-sorumluluk": { hover: true, click: null, drag: false, hint: "" },
  discovery: { hover: true, click: null, drag: true, hint: "sürükle · hafif tilt" },
  beyond: { hover: true, click: "domain", drag: true, hint: "kümeye tıkla · yaklaş" },
  creation: { hover: true, click: null, drag: true, hint: "sürükle · içeriye bak" },
  layers: { hover: true, click: "layer", drag: true, hint: "katmana tıkla · içini aç" },
  inquiry: { hover: true, click: "layer", drag: true, hint: "katmana tıkla · incele" },
  // "Hareket neredeyse durur": özen = sakinlik. Hover çok hafif, sürükleme yok.
  approach: { hover: true, click: null, drag: false, hint: "" },
  vision: { hover: true, click: "sector", drag: true, hint: "dilime tıkla · yaklaş" },
  work: { hover: true, click: null, drag: false, hint: "" },
  contact: { hover: true, click: null, drag: false, hint: "" },
};

/** İkinci seviye (mikro dünya): hover ve sürükleme açık; tıklama servis seçer (StoryStage ayrı ele alır). */
export const MICRO_INTERACTION: Interaction = { hover: true, click: null, drag: true, hint: "servise tıkla · açıklama" };

export function interactionAt(pos: number): Interaction {
  return TABLE[SECTION_ORDER[Math.min(SECTION_ORDER.length - 1, Math.max(0, Math.floor(pos)))]] ?? NONE;
}

export interface Focus {
  kind: ClickKind;
  layer: number; // 0..4 (domain i = küme i = katman i)
}

/**
 * Odak modunda sahnenin hedef durumu: koreografinin o anki durumunun üstüne bir yama.
 * Geri çıkınca yama kalkar, sahne koreografinin durumuna yumuşakça döner (aynı yumuşatma).
 */
export function focusState(f: Focus, base: SceneState): SceneState {
  const common = { active: f.layer, behave: 1, drift: 0.12, flow: 0, nest: 0, frame: 0.9 };
  switch (f.kind) {
    case "layer":
      // Çekmece açılır (iç yapı), geri kalan x-ray, kısmi blueprint; kamera katmanı izler ve yaklaşır.
      return {
        ...base,
        ...common,
        inspect: 1,
        explode: Math.max(base.explode, 0.85),
        xray: 0.9,
        blueprint: 0.5,
        follow: 1,
        camDist: 0.62,
        camEl: 0.5,
        camAz: -0.12,
        fov: 30,
      };
    case "sector": {
      const [x, y, z] = sectorPoint(f.layer);
      return { ...base, ...common, xray: 0.85, blueprint: 0.35, follow: 0, tx: x, ty: y, tz: z, camDist: 0.6, camEl: 0.75, fov: 30 };
    }
    case "domain": {
      const [x, y, z] = FIELD_NODES[f.layer];
      return { ...base, ...common, xray: 0.5, blueprint: 0, follow: 0, tx: x, ty: y, tz: z, camDist: 0.46, camEl: 0.42, fov: 30 };
    }
  }
}

/** Odak modundan, kullanıcı bu kadar scroll ederse (ekran yüksekliğinin oranı) çıkılır: sıkışma yok. */
export const FOCUS_SCROLL_EXIT = 0.5;
export const DRAG_CLICK_SLOP = 6; // px: bundan kısa hareket = tıklama
