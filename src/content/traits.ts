import type { Trait } from "./types";

// Altı kişisel özellik ve sitedeki karşılıkları. scripts/check-content.mjs her özelliğin
// hem ana sayfada hem Hakkımda'da gerçekten bir bölüme bağlandığını denetler.
export const TRAITS: readonly Trait[] = [
  { id: "interdisciplinary", title: "Disiplinler arası merak", pillar: "merak", tense: "present", homeSection: "beyond", aboutSection: "beyond" },
  { id: "sharing", title: "Bilgi paylaşımı", pillar: "merak", tense: "goal", homeSection: "beyond", aboutSection: "sharing" },
  { id: "holistic", title: "Bütünsel düşünme", pillar: "uretim", tense: "present", homeSection: "layers", aboutSection: "holistic" },
  { id: "inquiry", title: "Sorgulayıcı yaklaşım", pillar: "uretim", tense: "present", homeSection: "inquiry", aboutSection: "inquiry" },
  { id: "values", title: "İnsani çalışma değerleri", pillar: "sorumluluk", tense: "present", homeSection: "approach", aboutSection: "values" },
  { id: "independent", title: "Bağımsız üretim", pillar: "sorumluluk", tense: "goal", homeSection: "vision", aboutSection: "future" },
];
