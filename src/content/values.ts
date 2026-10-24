import type { Value } from "./types";

// İş ilişkilerinde belirleyici değerler (kullanıcının iki brief'teki listelerinin birleşimi).
export const VALUES: readonly Value[] = [
  { id: "trust", label: "Güven" },
  { id: "responsibility", label: "Sorumluluk" },
  { id: "loyalty", label: "Sadakat" },
  { id: "fairness", label: "Adalet" },
  { id: "openness", label: "Açıklık" },
  { id: "balance", label: "Karşılıklı denge" },
  { id: "longterm", label: "Uzun vadeli iş birliği" },
];
