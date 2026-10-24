import type { Domain } from "./types";

// Merakın Peşinde: yazılım dışındaki ilgi alanları. Merkezde yazılım (3D'de küçük katman çekirdeği),
// çevresinde bu beş alan. `layer` = 3D'de alanı temsil eden katman; renk o katmanın tonundan gelir
// (renk = katman kuralı, bkz. docs/story-architecture.md §2).
//
// Açıklamalar bilerek SORU biçiminde: araştırdığım konuları gösterir, uzmanlık iddia etmez.
export const DOMAINS: readonly Domain[] = [
  {
    id: "behavior",
    label: "İnsan davranışları",
    question: "İnsanlar bir sistemi neden böyle kullanıyor, neden vazgeçiyor?",
    layer: 0,
  },
  {
    id: "ai",
    label: "Yapay zekâ",
    question: "Makineler nasıl öğreniyor ve bu, üretme biçimimizi nasıl değiştiriyor?",
    layer: 1,
  },
  {
    id: "social",
    label: "Sosyal bilimler",
    question: "Teknoloji toplulukları, işi ve ilişkileri nasıl dönüştürüyor?",
    layer: 2,
  },
  {
    id: "philosophy",
    label: "Felsefe",
    question: "Neyi neden yapıyoruz; doğru, adil ve sorumlu olan ne?",
    layer: 3,
  },
  {
    id: "digital",
    label: "Dijital dönüşüm",
    question: "Bir kurum ya da süreç dijitalleşirken gerçekte ne değişiyor?",
    layer: 4,
  },
];

// Alanlar arası bağlar (3D'de ışık akan çizgiler). Merkez -> her alan bağı ayrıca her zaman vardır.
export const DOMAIN_LINKS: readonly [number, number][] = [
  [0, 2], // insan davranışları — sosyal bilimler
  [1, 3], // yapay zekâ — felsefe
  [1, 4], // yapay zekâ — dijital dönüşüm
  [2, 4], // sosyal bilimler — dijital dönüşüm
  [0, 3], // insan davranışları — felsefe
];
