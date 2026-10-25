// Klasik galeri sahnesi için özgün (procedural) mimari parçalar ve taş dokuları.
// Heykel (büst) hazır, lisanslı bir modeldir (public/models/marble-bust, CC0). Burada üretilenler:
//   - mermer / kireçtaşı / traverten dokuları (damar, tane, pürüzlülük, normal)
//   - yivli gövdeli, akantus yapraklı ve volütlü Korint sütunu
//   - kaide (kornişli, kabartma profilli)
//   - Barok kabartma paneli (yükseklik haritasından gerçek geometri kabartması)
// Bunlar fotogrametri değil; el yapımı kurallarla üretilmiş özgün formlardır ve bunun sınırı
// docs/classic-gallery.md'de açıkça yazılıdır.

import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  LatheGeometry,
  LinearFilter,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  ExtrudeGeometry,
  Vector2,
  LinearMipmapLinearFilter,
} from "three";

const wrap = (x: number) => ((x % 1) + 1) % 1; // JS % negatifte negatif döner; doku koordinatı her zaman 0..1

// ---- Gürültü -----------------------------------------------------------------------------------
function makeNoise(seed: number, cells: number[]) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const oct = cells.map((n) => {
    const g = new Float32Array((n + 1) * (n + 1));
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    return { n, g };
  });
  const at = (o: { n: number; g: Float32Array }, u: number, v: number) => {
    const fx = u * o.n;
    const fy = v * o.n;
    const x0 = Math.floor(fx) % o.n;
    const y0 = Math.floor(fy) % o.n;
    const tx = fx - Math.floor(fx);
    const ty = fy - Math.floor(fy);
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const w = o.n + 1;
    const a = o.g[y0 * w + x0];
    const b = o.g[y0 * w + x0 + 1];
    const c = o.g[(y0 + 1) * w + x0];
    const d = o.g[(y0 + 1) * w + x0 + 1];
    return MathUtils.lerp(MathUtils.lerp(a, b, sx), MathUtils.lerp(c, d, sx), sy);
  };
  /** 0..1, u/v 0..1 (döşenebilir). */
  const fbm = (u: number, v: number) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    for (const o of oct) {
      sum += at(o, u, v) * amp;
      norm += amp;
      amp *= 0.52;
    }
    return sum / norm;
  };
  return { fbm, rnd };
}

export type StoneKind = "carrara" | "ivory" | "limestone" | "travertine";

const STONES: Record<StoneKind, { base: [number, number, number]; vein: [number, number, number]; veinAmt: number; veinScale: number; grain: number; pores: number }> = {
  carrara: { base: [236, 234, 229], vein: [128, 130, 134], veinAmt: 0.55, veinScale: 5, grain: 0.05, pores: 0 },
  ivory: { base: [236, 227, 207], vein: [186, 160, 126], veinAmt: 0.38, veinScale: 4, grain: 0.06, pores: 0 },
  limestone: { base: [214, 200, 176], vein: [172, 154, 126], veinAmt: 0.18, veinScale: 3, grain: 0.1, pores: 0.25 },
  travertine: { base: [219, 203, 176], vein: [168, 146, 114], veinAmt: 0.3, veinScale: 3, grain: 0.09, pores: 0.9 },
};

export interface StoneTextures {
  map: CanvasTexture;
  rough: CanvasTexture;
  normal: CanvasTexture;
}

/** Yükseklik haritasından (0..255 gri) teğet uzayı normal haritası üretir. */
function heightToNormal(src: Uint8ClampedArray, S: number, strength: number): ImageData {
  const out = new ImageData(S, S);
  const h = (x: number, y: number) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * S + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255; // glTF/OpenGL: +Y yukarı
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  return out;
}

const tex = (c: HTMLCanvasElement, srgb: boolean, repeat = 1) => {
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  if (srgb) t.colorSpace = SRGBColorSpace;
  return t;
};

/** Gerçekçi taş: alan çarpıtmalı damarlar, ince tane, gözenek (traverten), pürüzlülük ve normal haritası. */
export function stoneTextures(kind: StoneKind, seed: number, size = 512): StoneTextures {
  const S = size;
  const P = STONES[kind];
  const n = makeNoise(seed, [4, 8, 16, 32, 64]);
  const warp = makeNoise(seed + 17, [3, 6, 12]);
  const cMap = document.createElement("canvas");
  const cRough = document.createElement("canvas");
  const cHeight = document.createElement("canvas");
  cMap.width = cMap.height = cRough.width = cRough.height = cHeight.width = cHeight.height = S;
  const mapCtx = cMap.getContext("2d")!;
  const roughCtx = cRough.getContext("2d")!;
  const hCtx = cHeight.getContext("2d")!;
  const mapImg = mapCtx.createImageData(S, S);
  const roughImg = roughCtx.createImageData(S, S);
  const hImg = hCtx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const v = y / S;
      const base = n.fbm(u, v);
      // Damar: çarpıtılmış koordinatta ince çizgi (|sin| yoğunluğu), iki ölçek
      const wu = (warp.fbm(u, v) - 0.5) * 1.6;
      const wv = (warp.fbm(v, u) - 0.5) * 1.6;
      // Damar: çarpıtılmış alçak frekanslı gürültünün "sırt" çizgisi (|2n-1| ~ 0 olan ince bantlar), iki ölçek.
      const r1 = 1 - Math.abs(2 * n.fbm(wrap(u + wu * 0.45), wrap(v + wv * 0.45)) - 1);
      const r2 = 1 - Math.abs(2 * warp.fbm(wrap(v + wv * 0.6 + 0.37), wrap(u + wu * 0.6)) - 1);
      const veinMask = Math.pow(r1, 22) * 0.95 + Math.pow(r2, 30) * 0.7;
      const cloud = (base - 0.5) * 2; // -1..1
      let k = 1 + cloud * 0.045 + (n.rnd() - 0.5) * P.grain * 0.4;
      let pore = 0;
      if (P.pores > 0) {
        // Traverten: yatay uzamış gözenekler
        const pv = n.fbm((u * 3) % 1, (v * 14) % 1);
        pore = pv > 0.66 ? (pv - 0.66) * 3.2 * P.pores : 0;
        k -= pore * 0.28;
      }
      const vm = Math.min(1, veinMask * P.veinAmt);
      const i = (y * S + x) * 4;
      for (let c = 0; c < 3; c++) {
        const b = P.base[c] * k;
        mapImg.data[i + c] = MathUtils.lerp(b, P.vein[c] * (0.92 + base * 0.12), vm);
      }
      mapImg.data[i + 3] = 255;
      // Pürüzlülük: damar ve gözenek mat; geniş alan hafif cilalı
      const r = MathUtils.clamp(0.46 + cloud * 0.08 + vm * 0.22 + pore * 0.5 + (n.rnd() - 0.5) * 0.04, 0, 1);
      roughImg.data[i] = roughImg.data[i + 1] = roughImg.data[i + 2] = 255;
      roughImg.data[i + 1] = r * 255; // glTF: G = roughness
      roughImg.data[i + 2] = 0; // B = metalness
      roughImg.data[i + 3] = 255;
      const hv = MathUtils.clamp(0.5 + cloud * 0.18 - vm * 0.12 - pore * 0.4 + (n.rnd() - 0.5) * P.grain, 0, 1) * 255;
      hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = hv;
      hImg.data[i + 3] = 255;
    }
  }
  mapCtx.putImageData(mapImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);
  hCtx.putImageData(hImg, 0, 0);
  const cNormal = document.createElement("canvas");
  cNormal.width = cNormal.height = S;
  cNormal.getContext("2d")!.putImageData(heightToNormal(hImg.data, S, kind === "travertine" ? 5 : 3), 0, 0);
  return { map: tex(cMap, true), rough: tex(cRough, false), normal: tex(cNormal, false) };
}

// ---- Barok kabartma: yükseklik haritası -> gerçek geometri kabartması -------------------------
export interface ReliefMaps {
  height: CanvasTexture;
  normal: CanvasTexture;
}

/**
 * Simetrik bir niş çerçevesi içinde akantus sarmalı, yuvarlak tomurcuklar ve boncuk dizisi.
 * Her öğe radyal bir gradyanla "yumuşak yuvarlak" yükseklik bırakır; 'lighter' ile birleşip kabartma oluşur.
 */
export function baroqueRelief(seed = 3, W = 1024, H = 1280): ReliefMaps {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "lighter";
  const n = makeNoise(seed, [6, 12]);

  // Yuvarlak tepeli leke: merkezden dışa düşen yükseklik
  const blob = (x: number, y: number, rx: number, ry: number, rot: number, a: number) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(255,255,255,${a})`);
    gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.55})`);
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, 1, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  // Akantus yaprağı: taban -> uç boyunca lobajlı yapraklar
  const leaf = (x: number, y: number, ang: number, len: number, wid: number, a: number) => {
    const lobes = 5;
    for (let i = 0; i < lobes; i++) {
      const t = (i + 0.5) / lobes;
      const lx = x + Math.cos(ang) * len * t;
      const ly = y + Math.sin(ang) * len * t;
      const w = wid * (0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)));
      for (const side of [-1, 1]) {
        const off = w * 0.55 * side;
        blob(lx + Math.cos(ang + Math.PI / 2) * off, ly + Math.sin(ang + Math.PI / 2) * off, w * 0.62, w * 0.3, ang + side * 0.5, a * (0.8 + 0.2 * n.rnd()));
      }
    }
    // Orta damar
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      blob(x + Math.cos(ang) * len * t, y + Math.sin(ang) * len * t, wid * 0.16, wid * 0.16, 0, a * 0.7);
    }
  };
  // Sarmal gövde: logaritmik spiral boyunca yaprak dizisi (dışa doğru küçülür)
  const scroll = (cx: number, cy: number, dir: 1 | -1, scale: number) => {
    let ang = Math.PI * 0.15;
    let r = 150 * scale;
    for (let i = 0; i < 20; i++) {
      const th = i * 0.42;
      const rr = r * Math.exp(-th * 0.26);
      const x = cx + Math.cos(dir * th + ang) * rr * dir * 1.0;
      const y = cy + Math.sin(dir * th + ang) * rr;
      const tangent = dir * th + ang + Math.PI / 2;
      const size = Math.max(14, rr * 0.55);
      leaf(x, y, tangent * dir + (dir === -1 ? Math.PI : 0), size * 1.6, size * 0.7, 0.62);
      blob(x, y, size * 0.34, size * 0.34, 0, 0.9);
    }
    // Merkez gülçe
    for (let k = 4; k >= 1; k--) blob(cx, cy, 20 * scale * k * 0.7, 20 * scale * k * 0.7, 0, 0.5);
  };

  // Çerçeve: kemerli niş dış hattı boyunca boncuk dizisi + iki şerit
  const archPath = (inset: number, fn: (x: number, y: number, t: number, ang: number) => void) => {
    const x0 = 110 + inset;
    const x1 = W - 110 - inset;
    const r = (x1 - x0) / 2;
    const cx = W / 2;
    const top = 150 + inset + r;
    const yb = H - 110 - inset;
    // sol dikme (aşağıdan yukarı), kemer, sağ dikme (yukarıdan aşağı)
    const segs: [number, number, number][] = [];
    for (let y = yb; y > top; y -= 1) segs.push([x0, y, -Math.PI / 2]);
    for (let a = Math.PI; a >= 0; a -= 0.004) segs.push([cx + Math.cos(a) * r, top - Math.sin(a) * r, a - Math.PI / 2]);
    for (let y = top; y < yb; y += 1) segs.push([x1, y, Math.PI / 2]);
    segs.forEach(([x, y, ang], i) => fn(x, y, i / segs.length, ang));
  };
  let bead = 0;
  archPath(0, (x, y, t, ang) => {
    bead++;
    if (bead % 14 === 0) blob(x, y, 11, 11, 0, 0.95);
  });
  archPath(34, (x, y) => {
    if (bead++ % 3 === 0) blob(x, y, 8, 8, 0, 0.55);
  });
  archPath(62, (x, y, t, ang) => {
    // Yumurta-ok bandı: değişen uzun yumurtalar
    if (bead++ % 22 === 0) blob(x, y, 13, 7, ang, 0.85);
  });

  // İçerik: simetrik sarmallar ve merkez rozet
  const cx = W / 2;
  scroll(cx - 190, 760, 1, 1.1);
  scroll(cx + 190, 760, -1, 1.1);
  scroll(cx - 170, 1010, 1, 0.85);
  scroll(cx + 170, 1010, -1, 0.85);
  // Merkez: akantus çiçeği ve damla
  leaf(cx, 640, -Math.PI / 2, 250, 80, 0.75);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    blob(cx + Math.cos(a) * 52, 450 + Math.sin(a) * 52, 34, 22, a, 0.9);
  }
  for (let k = 5; k >= 1; k--) blob(cx, 450, 16 * k, 16 * k, 0, 0.42);
  // Üst kemerde yarım palmet (yelpaze)
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    leaf(cx + Math.cos(a) * 60, 330 + Math.sin(a) * 30, a, 120, 36, 0.7);
  }

  g.globalCompositeOperation = "source-over";
  // Yumuşatma: keskin kenarları yuvarla (taş oyma hissi)
  const soft = document.createElement("canvas");
  soft.width = W;
  soft.height = H;
  const sg = soft.getContext("2d")!;
  sg.filter = "blur(2.2px)";
  sg.drawImage(c, 0, 0);
  const hi = sg.getImageData(0, 0, W, H);

  // Normal haritası (yükseklikten)
  const nrm = document.createElement("canvas");
  nrm.width = W;
  nrm.height = H;
  const out = new ImageData(W, H);
  const hh = (x: number, y: number) => hi.data[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (hh(x + 1, y) - hh(x - 1, y)) * 5;
      const dy = (hh(x, y + 1) - hh(x, y - 1)) * 5;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * W + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  nrm.getContext("2d")!.putImageData(out, 0, 0);
  const ht = new CanvasTexture(soft);
  ht.minFilter = LinearFilter;
  const nt = new CanvasTexture(nrm);
  return { height: ht, normal: nt };
}

// ---- Korint sütunu -------------------------------------------------------------------------------
/** Çok bölümlü profil (r, y) noktalarından döner gövde. */
function lathe(points: [number, number][], seg = 64) {
  return new LatheGeometry(points.map(([r, y]) => new Vector2(r, y)), seg);
}
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 10): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = MathUtils.lerp(a0, a1, i / n);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/** Attik kaide: alt torus, skotya (içbükey oyuk), üst torus. */
export function columnBase(R: number): BufferGeometry {
  const pts: [number, number][] = [
    [0, 0],
    [R * 1.55, 0],
    [R * 1.55, 0.05],
    ...arc(R * 1.42, 0.17, 0.12, -Math.PI / 2 + 0.2, Math.PI / 2, 12), // alt torus
    [R * 1.2, 0.3],
    ...arc(R * 1.22, 0.42, 0.1, -Math.PI / 2, Math.PI / 2, 8).map(([x, y]): [number, number] => [R * 1.1 - (x - R * 1.22) * 0.9, y]).reverse(), // skotya
    ...arc(R * 1.14, 0.62, 0.09, -Math.PI / 2, Math.PI / 2 - 0.2, 10), // üst torus
    [R * 1.02, 0.7],
    [R * 1.0, 0.8],
    [0, 0.8],
  ];
  const g = lathe(pts, 96);
  g.computeVertexNormals();
  return g;
}

/** Yivli gövde: 24 yiv, hafif entasis (ortada şişkin), yiv uçları yumuşak kapanır. */
export function columnShaft(R: number, height: number, flutes = 24): BufferGeometry {
  const ROWS = 220;
  const PER = 14; // yiv başına örnek
  const around = flutes * PER;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= ROWS; j++) {
    const t = j / ROWS;
    const y = t * height;
    const entasis = 1 - 0.14 * t + 0.025 * Math.sin(Math.PI * t); // yukarı incelir
    const endFade = MathUtils.smoothstep(t, 0.0, 0.035) * (1 - MathUtils.smoothstep(t, 0.965, 1.0));
    for (let i = 0; i < around; i++) {
      const th = (i / around) * Math.PI * 2;
      const f = (i % PER) / PER; // 0..1 yiv içi
      const concave = Math.sqrt(Math.max(0, 1 - Math.pow(2 * f - 1, 2))); // yarım daire oyuk
      const depth = 0.075 * R * concave * endFade;
      const r = R * entasis - depth;
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      uv.push((i / around) * 6, t * 8);
    }
  }
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < around; i++) {
      const n = (i + 1) % around;
      const a = j * around + i;
      const b = j * around + n;
      const c = (j + 1) * around + i;
      const d = (j + 1) * around + n;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Tek bir akantus yaprağı: lobajlı kenar, orta damar, dışa kıvrılan uç. Yerel eksen: +Y yukarı, +Z dışa. */
function acanthusLeaf(L: number, W: number, curl: number, lobes = 4, seed = 1): BufferGeometry {
  const NU = 22;
  const NV = 34;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const nz = makeNoise(seed, [3, 6]);
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    // Genişlik: tabanda dar, 0.45'te en geniş, uca doğru sivrilir; kenar lobajlı.
    const base = Math.pow(Math.sin(Math.PI * Math.min(1, 0.18 + v * 0.82) ), 0.8);
    const scallop = 1 - 0.32 * Math.pow(0.5 + 0.5 * Math.cos(v * Math.PI * 2 * lobes), 1.4) * MathUtils.smoothstep(v, 0.12, 0.4);
    const hw = W * 0.5 * base * scallop;
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * 2 - 1; // -1..1
      const x = u * hw;
      const y = v * L;
      // Dışa kıvrım: tabanda dik, uçta öne eğilir
      const bend = curl * Math.pow(v, 2.0) * L;
      // Yaprak yüzeyi: orta damar yüksek, kenarlar yukarı kıvrık (kaşık), lob başına dalga
      const rib = -0.05 * L * Math.pow(1 - Math.abs(u), 2.2);
      const cup = 0.06 * L * u * u;
      const wave = 0.018 * L * Math.sin(v * Math.PI * 2 * lobes + u * 2.2) * MathUtils.smoothstep(v, 0.15, 0.5);
      const jitter = (nz.fbm(i / NU, v) - 0.5) * 0.02 * L;
      const z = bend + rib + cup + wave + jitter + 0.02 * L * v;
      pos.push(x, y, z);
      uv.push(i / NU, v);
    }
  }
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NU; i++) {
      const a = j * (NU + 1) + i;
      idx.push(a, a + 1, a + NU + 1, a + 1, a + NU + 2, a + NU + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export interface CapitalParts {
  bell: BufferGeometry;
  leavesLow: BufferGeometry[];
  leavesHigh: BufferGeometry[];
  abacus: BufferGeometry;
  /** Yaprak yerleşimleri: yarıçap, açı, yükseklik, eğim. */
  placements: { geo: BufferGeometry; r: number; angle: number; y: number; lean: number }[];
  height: number;
  volutes: { path: [number, number, number][]; radius: number }[];
}

/** Korint başlığı: çan gövde, iki sıra 8'er akantus yaprağı, köşe volütleri, içbükey kenarlı abaküs. */
export function corinthianCapital(R: number): CapitalParts {
  const h = R * 3.1;
  const bell = lathe(
    [
      [R * 0.96, 0],
      [R * 0.98, h * 0.06],
      [R * 1.12, h * 0.34],
      [R * 1.3, h * 0.62],
      [R * 1.42, h * 0.82],
      [R * 1.45, h * 0.88],
      [R * 1.3, h * 0.89],
      [R * 1.0, h * 0.88],
      [0, h * 0.88],
    ],
    96,
  );
  bell.computeVertexNormals();
  const placements: CapitalParts["placements"] = [];
  const low = acanthusLeaf(h * 0.46, R * 1.5, 0.22, 4, 11);
  const high = acanthusLeaf(h * 0.44, R * 1.3, 0.26, 3, 23);
  for (let i = 0; i < 8; i++) {
    placements.push({ geo: low, r: R * 1.02, angle: (i / 8) * Math.PI * 2, y: h * 0.05, lean: 0.12 });
    placements.push({ geo: high, r: R * 1.16, angle: ((i + 0.5) / 8) * Math.PI * 2, y: h * 0.3, lean: 0.2 });
  }
  // Abaküs: kare levha, kenarları içbükey (klasik), ince kornişli
  const s = R * 1.62;
  const sh = new Shape();
  const k = R * 0.34; // içbükey derinliği
  const corner = s;
  sh.moveTo(-corner, -corner);
  sh.quadraticCurveTo(0, -corner + k * 2, corner, -corner);
  sh.quadraticCurveTo(corner - k * 2, 0, corner, corner);
  sh.quadraticCurveTo(0, corner - k * 2, -corner, corner);
  sh.quadraticCurveTo(-corner + k * 2, 0, -corner, -corner);
  const abacus = new ExtrudeGeometry(sh, { depth: h * 0.12, bevelEnabled: true, bevelSize: R * 0.03, bevelThickness: R * 0.03, bevelSegments: 3, curveSegments: 20 });
  abacus.rotateX(-Math.PI / 2);
  abacus.translate(0, h * 0.86, 0);
  // Volütler: köşelerde, logaritmik spiral eğrisi (Tube için nokta yolu)
  const volutes: CapitalParts["volutes"] = [];
  for (let q = 0; q < 4; q++) {
    const a = (q / 4) * Math.PI * 2 + Math.PI / 4;
    const path: [number, number, number][] = [];
    const turns = 1.9;
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * turns * Math.PI * 2;
      const rr = R * 0.32 * Math.exp(-t * 0.19);
      // Spiral düzlem: köşeye dik, dışa bakan
      const lx = Math.cos(t) * rr;
      const ly = Math.sin(t) * rr;
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      const ox = -Math.sin(a);
      const oz = Math.cos(a);
      const base = R * 1.45;
      path.push([dx * base + ox * lx * 1.2 + dx * (ly * 0.2), h * 0.72 + ly, dz * base + oz * lx * 1.2 + dz * (ly * 0.2)]);
    }
    volutes.push({ path, radius: R * 0.06 });
  }
  return { bell, leavesLow: [low], leavesHigh: [high], abacus, placements, height: h, volutes };
}

/** Kaide: kornişli, taban silmeli kare kütle (4 kenarlı döner profil, düz gölgeli). */
export function pedestal(width: number, height: number): BufferGeometry {
  const w = width / 2;
  const prof: [number, number][] = [
    [0, 0],
    [w * 1.28, 0],
    [w * 1.28, height * 0.05],
    [w * 1.2, height * 0.07],
    [w * 1.2, height * 0.1],
    [w * 1.1, height * 0.12],
    [w * 1.0, height * 0.14],
    [w * 1.0, height * 0.82],
    [w * 1.06, height * 0.84],
    [w * 1.06, height * 0.87],
    [w * 1.2, height * 0.9],
    [w * 1.2, height * 0.93],
    [w * 1.28, height * 0.95],
    [w * 1.28, height],
    [0, height],
  ];
  // 4 kenar: kare kesit, 45° döndürülür; R yarıçapı köşegen olduğundan kenar/√2 ile ölçeklenir.
  const g = lathe(prof.map(([r, y]) => [r * Math.SQRT2, y]), 4).toNonIndexed();
  g.rotateY(Math.PI / 4);
  g.computeVertexNormals();
  return g;
}
