// Katman desenleri: her yetkinlik kendi modül ızgarasına sahip.
// Desenler 0..1 normalize koordinatta tanımlı; ızgara çözünürlüğünden bağımsız
// (full=12, lite=8) böylece aynı kompozisyon iki seviyede de okunur.

export const LAYER_COUNT = 5;
export const SLAB_SIZE = 5; // her katmanın kenar uzunluğu (dünya birimi)

// Deterministik hash: aynı (layer,i,j) her zaman aynı sonucu verir; SSR/yenileme farkı yok.
function hash(a: number, b: number, c: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

type Pattern = (u: number, v: number, cell: number, h: number) => boolean;

const PATTERNS: readonly Pattern[] = [
  // 0 · Mobil: dikey telefon çerçevesi + üst çentik
  (u, v, cell, h) => {
    const inside = u > 0.3 && u < 0.7 && v > 0.06 && v < 0.94;
    if (!inside) return false;
    const edge = u < 0.3 + cell || u > 0.7 - cell || v < 0.06 + cell || v > 0.94 - cell;
    return edge || h < 0.3;
  },
  // 1 · Web: tarayıcı penceresi (çerçeve + üst bar + seyrek içerik)
  (u, v, cell, h) => {
    const frame = u < cell || u > 1 - cell || v < cell || v > 1 - cell;
    const bar = v > 0.14 && v < 0.14 + cell;
    return frame || bar || (v > 0.22 && h < 0.22);
  },
  // 2 · Backend: sunucu rafları (dolu / boş yatay şeritler)
  (u, v) => Math.floor(v * 8) % 2 === 0 && u > 0.08 && u < 0.92,
  // 3 · Veri & altyapı: 2×2 blok kümeleri (dama)
  (u, v) => (Math.floor(u * 5) + Math.floor(v * 5)) % 2 === 0,
  // 4 · Güvenlik: elmas kafes + dolu çekirdek
  (u, v, _cell, h) => {
    const d = Math.abs(u - 0.5) + Math.abs(v - 0.5);
    return d < 0.1 || (d < 0.48 && h < 0.55 && Math.round((u + v) * 10) % 2 === 0);
  },
];

export interface LayerInstances {
  count: number;
  offsets: Float32Array; // vec3, katman-yerel merkez
  scales: Float32Array; // vec3
  rands: Float32Array; // vec4
  layers: Float32Array; // float
  /** Hikâye sahnesi: alan takımyıldızı hedefi (xyz merkez, w ölçek). */
  field: Float32Array; // vec4
  /** Hikâye sahnesi: ortak disk hedefi (x, z, yaw, teğetsel genişlik; -1 = merkez çekirdek). */
  form: Float32Array; // vec4
}

// Merakın Peşinde: her katman bir bilgi alanı kümesine dönüşür (nesne uzayı konumları).
// Merkez (0,0,0) yazılım çekirdeği: katman plakaları orada küçük bir yığın olur.
export const FIELD_NODES: readonly [number, number, number][] = Array.from({ length: LAYER_COUNT }, (_, i) => {
  const a = (i / LAYER_COUNT) * Math.PI * 2 + 0.35;
  const y = [1.25, -0.55, 0.85, -1.15, 0.2][i];
  return [Math.cos(a) * 3.7, y, Math.sin(a) * 3.7];
});
const FIELD_SCALE = 0.34; // küme = katman deseninin minyatürü (desen okunur kalsın)
const CORE_SCALE = 0.34;

// Gelecek: beş katman tek dairesel zeminde eşit dilimler (ortak, dengeli yapı).
const SECTOR = (Math.PI * 2) / LAYER_COUNT;
const FORM_R0 = 1.1;
const FORM_DR = 3.4;
/** Disk biçiminde modüllerin radyal derinliği (grid'e bağlı; shader uniform'u). */
export const formRadial = (grid: number) => (FORM_DR / grid) * 0.82;

export function buildInstances(grid: number): LayerInstances {
  const cell = SLAB_SIZE / grid;
  const nCell = cell / SLAB_SIZE; // normalize hücre boyu
  const offsets: number[] = [];
  const scales: number[] = [];
  const rands: number[] = [];
  const layers: number[] = [];
  const field: number[] = [];
  const form: number[] = [];

  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    // Katman zemin plakası: modüllerin üstünde durduğu ince, geniş döşeme.
    offsets.push(0, -0.09, 0);
    scales.push(SLAB_SIZE + 0.15, 0.06, SLAB_SIZE + 0.15);
    rands.push(hash(layer, 99, 1), hash(layer, 99, 2), hash(layer, 99, 3), hash(layer, 99, 4));
    layers.push(layer);
    field.push(0, (2 - layer) * 0.2, 0, CORE_SCALE);
    form.push(0, 0, 0, -1); // plaka: diskte merkez çekirdeğe dönüşür (shader, aForm.w < 0)

    const [nx, ny, nz] = FIELD_NODES[layer];

    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const u = (i + 0.5) / grid;
        const v = (j + 0.5) / grid;
        const h = hash(layer, i, j);
        if (!PATTERNS[layer](u, v, nCell, h)) continue;

        // Bazı modüller sütuna dönüşür: siluet kırılır, "mimari" his verir.
        const pillar = hash(layer + 7, i, j) > 0.93;
        const height = 0.16 + (pillar ? 0.2 + hash(layer + 3, j, i) * 0.4 : 0);
        const gap = cell * 0.1;

        offsets.push((u - 0.5) * SLAB_SIZE, height / 2, (v - 0.5) * SLAB_SIZE);
        scales.push(cell - gap, height, cell - gap);
        rands.push(hash(i, j, layer), hash(j, layer, i), hash(layer, i, j + 5), hash(i + 3, j + 1, layer));
        layers.push(layer);

        const ox = (u - 0.5) * SLAB_SIZE;
        const oz = (v - 0.5) * SLAB_SIZE;
        field.push(nx + ox * FIELD_SCALE, ny + (height / 2) * FIELD_SCALE, nz + oz * FIELD_SCALE, FIELD_SCALE);

        // Dilim: u -> açı (dilim içinde), v -> yarıçap. Yaw, modülün x eksenini teğete hizalar.
        const ang = (layer + 0.06 + u * 0.88) * SECTOR;
        const r = FORM_R0 + v * FORM_DR;
        const tang = ((r * SECTOR * 0.88) / grid) * 0.82;
        form.push(Math.cos(ang) * r, Math.sin(ang) * r, -(ang + Math.PI / 2), tang);
      }
    }
  }

  return {
    count: layers.length,
    offsets: new Float32Array(offsets),
    scales: new Float32Array(scales),
    rands: new Float32Array(rands),
    layers: new Float32Array(layers),
    field: new Float32Array(field),
    form: new Float32Array(form),
  };
}
