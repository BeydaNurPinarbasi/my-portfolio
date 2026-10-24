import type { Pillar, PillarId } from "./types";

// Hikâyenin omurgası. Tanımlar kullanıcının kendi ifadeleridir; yeniden yazılmaz.
export const PILLARS: readonly Pillar[] = [
  { id: "merak", numeral: "I", title: "Merak", definition: "Bilgiyi keşfetmek ve sorular sormak." },
  { id: "uretim", numeral: "II", title: "Üretim", definition: "Fikirleri çalışan yazılım sistemlerine dönüştürmek." },
  { id: "sorumluluk", numeral: "III", title: "Sorumluluk", definition: "Ürettiğim işin ve kurduğum ilişkilerin arkasında durmak." },
];

export const pillar = (id: PillarId): Pillar => PILLARS.find((p) => p.id === id)!;
