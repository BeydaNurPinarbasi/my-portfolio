// Renk dili: tek kaynak. 3D sahne buradan okur; immersive.css token'ları aynı değerleri taşır.
//
// Kurallar
// - Zemin her zaman cream, metin her zaman midnight. Pastel tonlar metin rengi olarak kullanılmaz (kontrast yetmez).
// - rose = odak/etkileşim (aktif durum, ilerleme, ışık hattı). Ekranda tek "eylem" rengi.
// - Pastel tonlar = kategori kimliği. Her yetkinliğin bir tonu var; o ton 3D katmanda ve listede aynıdır.

export const PALETTE = {
  cream: "#FFF7E6", // Vanilla Cream: zemin
  blush: "#F7C8D3", // Blush Petal: vurgu yüzeyi
  rose: "#B46A72", // Rosewood: odak/etkileşim
  sage: "#A8B58A", // Sage Leaf
  sky: "#A9B7C6", // Misty Sky
  midnight: "#2D3A47", // Midnight Lagoon: metin
} as const;

// Paletten türetilmiş iki ara ton: 5 kategori için 4 pastel yetmediğinden.
export const TONES = {
  blush: PALETTE.blush,
  sky: PALETTE.sky,
  sage: PALETTE.sage,
  dusk: "#D2A2A0", // rose %60 + cream %40
  slate: "#717F8D", // midnight %45 + sky %55
} as const;

export type Tone = keyof typeof TONES;
