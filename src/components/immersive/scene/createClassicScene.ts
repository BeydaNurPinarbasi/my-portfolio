// Hakkımda · klasik galeri sahnesi (/about). Açık, sitenin paletine uygun atmosfer: krem zemin, pastel duvar alanları.
//
// Merkez: gerçek bir mermer büst (CC0, Poly Haven "Marble Bust 01", Rico Cilliers; bkz. public/models/marble-bust/LICENSE.md).
// Çevre: özgün procedural Korint sütunu (yivli gövde, akantus yaprakları, volütler), kornişli kaide ve
// yükseklik haritasından gerçek geometri kabartmalı Barok panel. Heykel ve mimari nötr taş malzemelerde kalır;
// palet yalnızca dijital katmanda: ince halkalar, yüzen parçalar, imleç ışığı, bilgi işaretleri (DOM).
//
// Sorumluluk sınırı: burası DOM, React ve GSAP bilmez. Kamera `cam` nesnesiyle sürülür; dışarıdaki GSAP bu
// nesneyi tween eder (koreografi bileşende). Sahne yalnızca okur, fare/sürükleme eklemelerini ekler.

import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PALETTE } from "@/lib/design/palette";
import { baroqueRelief, columnBase, columnShaft, corinthianCapital, pedestal, stoneTextures, type StoneKind } from "./classic/procedural";

export type ClassicTier = "full" | "lite" | "static";
export type ClassicPart = "bust" | "column" | "relief" | "pedestal";

export interface CamState {
  az: number;
  el: number;
  dist: number;
  fov: number;
  tx: number;
  ty: number;
  tz: number;
  /** 0..1: sahnenin metin panelinden uzağa kayması (lens kayması). */
  frame: number;
  // Dağılma / dönme (kaydırmayla sürülür): parçalar ayrışır, büst döner, başlık yükselir, kabartma geri kayar.
  yaw: number; // büstün kendi dönüşü (radyan)
  lift: number; // büstün kaideden yükselmesi
  cap: number; // Korint başlığının sütundan yükselip dönmesi
  spread: number; // kabartma ve levhanın derinlemesine ayrışması
  ring: number; // dijital halkaların ve parçaların açılması
}

export interface ClassicAnchor {
  x: number;
  y: number;
  on: boolean;
}

export interface ClassicScene {
  /** GSAP'in tween ettiği kamera durumu. */
  readonly cam: CamState;
  /** Varlıkları (büst, dokular) yükler; kamera ve ışık hazırdır, yüklenirken sahne boş çizilir. */
  load(): Promise<void>;
  setPointer(x: number | null, y: number): void;
  /** Sınırlı sürükleme: açı farkları (radyan), sahne içinde kısıtlanır. */
  setDrag(dAz: number, dEl: number): void;
  drag(): { az: number; el: number };
  pick(x: number, y: number): ClassicPart | null;
  hovered(): ClassicPart | null;
  /** İşaret noktalarının ekran konumları (STATIONS ile aynı sıra, genel görünüm hariç). */
  anchors(): readonly ClassicAnchor[];
  tick(timeSec: number, deltaSec: number): void;
  snap(): void;
  resize(width: number, height: number): void;
  setActive(active: boolean): void;
  dispose(): void;
}

interface Options {
  tier: ClassicTier;
  reduce: boolean;
  onContextLost?: () => void;
}

// ---- Yerleşim ------------------------------------------------------------------------------------
const PED_H = 1.5;
const BUST_SCALE = 5.2;
const BUST_Y = PED_H; // büst kaidenin üstünde
const COL = { x: -3.7, z: -2.4, R: 0.46, shaft: 5.2 };
const RELIEF = { x: 0.9, y: 3.95, z: -4.6, w: 5.8, h: 7.25 };

export type StationId = "overview" | "origin" | "drive" | "beyond" | "sharing" | "holistic" | "inquiry" | "approach" | "values" | "future";

export interface Station {
  id: StationId;
  /** İşaret noktası (dünya). Yoksa işaret çizilmez. */
  anchor?: [number, number, number];
  pose: CamState;
}

// Büst yerel kutusu (model): x[-0.12,0.15] y[0,0.515] z[-0.145,0.155]. Yüz 3/4 sola-öne bakar.
const bustAt = (x: number, y: number, z: number): [number, number, number] => [x * BUST_SCALE, BUST_Y + y * BUST_SCALE, z * BUST_SCALE];
type Fx = Partial<Pick<CamState, "yaw" | "lift" | "cap" | "spread" | "ring">>;
const cam = (az: number, el: number, dist: number, fov: number, t: [number, number, number], frame = 0, fx: Fx = {}): CamState => ({
  az, el, dist, fov, tx: t[0], ty: t[1], tz: t[2], frame, yaw: 0, lift: 0, cap: 0, spread: 0, ring: 0, ...fx,
});

// Hakkımda bölümlerinin her biri bir istasyondur (içerik eşlemesi: src/content/aboutStations.ts).
// Anlatı: Merak (yüz, saç, kabartma, profil) -> Üretim (sütun, başlık) -> Sorumluluk (kumaş, kaide, geri çekilme).
export const STATIONS: readonly Station[] = [
  { id: "overview", pose: cam(0.5, 0.1, 15.5, 34, [-0.2, 3.5, -1.0], 0.7) },
  { id: "origin", anchor: bustAt(0.015, 0.355, 0.1), pose: cam(0.32, 0.04, 2.9, 28, bustAt(0.01, 0.345, 0.05), 1, { yaw: 0.15 }) },
  { id: "drive", anchor: bustAt(0.0, 0.48, -0.02), pose: cam(-1.0, 0.32, 3.2, 30, bustAt(0.0, 0.43, -0.01), 1, { yaw: 0.7, ring: 0.3 }) },
  { id: "beyond", anchor: [RELIEF.x, RELIEF.y + 0.4, RELIEF.z + 0.2], pose: cam(-0.42, 0.2, 10.5, 32, [RELIEF.x, RELIEF.y + 0.4, RELIEF.z], 1, { spread: 1, ring: 0.8 }) },
  { id: "sharing", anchor: bustAt(-0.06, 0.33, 0.04), pose: cam(-1.35, 0.06, 3.6, 30, bustAt(0.0, 0.34, 0.02), 1, { yaw: -0.5, spread: 0.4 }) },
  { id: "holistic", anchor: [COL.x, 3.4, COL.z], pose: cam(0.25, 0.04, 11.5, 34, [COL.x + 0.6, 3.7, COL.z], 1, { cap: 0.5, spread: 0.3, ring: 0.5 }) },
  { id: "inquiry", anchor: [COL.x, 0.8 + COL.shaft + 0.8 + 1.4, COL.z], pose: cam(0.35, -0.22, 5.8, 32, [COL.x, 0.8 + COL.shaft + 1.9, COL.z], 1, { cap: 1.4 }) },
  { id: "approach", anchor: bustAt(0.0, 0.14, 0.12), pose: cam(0.5, 0.0, 3.8, 30, bustAt(0.0, 0.17 + 0.07, 0.05), 1, { lift: 0.35, yaw: 0.35 }) },
  { id: "values", anchor: [0, 0.9, 0.75], pose: cam(0.55, 0.12, 7.6, 32, [0, 2.4, 0], 1, { lift: 1.3, yaw: 1.0 }) },
  { id: "future", pose: cam(0.62, 0.34, 21, 36, [0, 3.4, -2.5], 0.7, { ring: 1.2 }) },
];

const DRAG_LIMIT = { az: 0.55, el: 0.22 };

export function createClassicScene(canvas: HTMLCanvasElement, opts: Options): ClassicScene {
  const full = opts.tier === "full";
  const reduce = opts.reduce;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  // Gölge haritası statik: sahnedeki kütleler hareket etmiyor, bir kez üretilir (4096 harita + 160k köşe her karede çizilmez).
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, full ? 2 : 1.5));

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.05, 120);

  // ---- Işık: sıcak ana ışık, serin kenar ışığı, çok düşük ortam ----
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.3;
  const key = new DirectionalLight(0xffe6c4, 3.0);
  key.position.set(-7, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(full ? 4096 : 1536, full ? 4096 : 1536);
  const sc = key.shadow.camera;
  sc.left = -9;
  sc.right = 9;
  sc.top = 10;
  sc.bottom = -3;
  sc.near = 1;
  sc.far = 40;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.06;
  key.shadow.radius = 5;
  key.shadow.intensity = 0.7; // krem zeminde gölge yumuşak ve hafif soğuk kalsın
  key.target.position.set(0, 2.5, -1);
  scene.add(key, key.target);
  const rim = new DirectionalLight(0xdfe6ee, 1.2);
  rim.position.set(7, 5, -6);
  scene.add(rim);
  scene.add(new HemisphereLight(0xfff6e6, 0xa9b7c6, 0.9));
  // İmleç ışığı: yüzeye düşen, parçaya göre pastel tonlu tek nokta ışığı.
  const touch = new PointLight(0xf7c8d3, 0, 7, 2);
  scene.add(touch);

  // Uzakta zemin ve nesneler sayfanın kremine karışır (sınır çizgisi görünmesin).
  scene.fog = new Fog(0xfff7e6, 26, 62);
  // ---- Zemin ----
  const floor = new Mesh(new CircleGeometry(30, 96), new MeshStandardMaterial({ color: 0xf7eedb, roughness: 0.95, metalness: 0, envMapIntensity: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const hitMeshes: { mesh: Mesh; part: ClassicPart }[] = [];
  // Kaydırmayla hareket eden parçalar (yükleme bitince dolar).
  let bustMesh: Mesh | null = null;
  let capGroup: Group | null = null;
  let capY = 0;
  let panelMesh: Mesh | null = null;
  let slabMesh: Mesh | null = null;
  const fxPrev = { yaw: NaN, lift: NaN, cap: NaN, spread: NaN, ring: NaN };
  const disposables: { dispose(): void }[] = [floor.geometry, floor.material as MeshStandardMaterial, envTex];
  const mark = (m: Mesh, part: ClassicPart) => {
    m.castShadow = true;
    m.receiveShadow = true;
    hitMeshes.push({ mesh: m, part });
  };

  // Arka plan renk alanları: galeri duvarı gibi büyük, yumuşak pastel yüzeyler (paletin tonları, sis uygulanmaz).
  const field = (color: string, w: number, h: number, x: number, y: number, z: number, opacity: number) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false }));
    m.position.set(x, y, z);
    scene.add(m);
    disposables.push(m.geometry, m.material as MeshBasicMaterial);
  };
  field(PALETTE.blush, 22, 14, -9, 6.5, -24, 0.45);
  field(PALETTE.sky, 16, 12, 9, 5.5, -27, 0.5);
  field(PALETTE.sage, 34, 8, 0, 3.4, -33, 0.35);

  // ---- Dijital katman: ince halkalar, yüzen parçalar, toz ----
  const digital = new Group();
  scene.add(digital);
  const tones = [PALETTE.sky, PALETTE.blush, PALETTE.rose, PALETTE.sage];
  const ringTones = [PALETTE.midnight, PALETTE.rose, PALETTE.sky];
  const rings: Mesh[] = [];
  ringTones.forEach((c, i) => {
    const r = new Mesh(new TorusGeometry(1.7 + i * 0.55, 0.0045, 6, 220), new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5 - i * 0.1, toneMapped: false }));
    r.position.set(0, BUST_Y + 0.2 * BUST_SCALE, 0);
    r.rotation.set(1.25 + i * 0.22, 0, 0.3 * (i % 2 ? 1 : -1));
    digital.add(r);
    rings.push(r);
    disposables.push(r.geometry, r.material as MeshBasicMaterial);
  });
  const shardGeo = new OctahedronGeometry(1);
  const shards: { m: Mesh; base: Vector3; ph: number }[] = [];
  {
    let s = 5;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (full ? 26 : 14); i++) {
      const m = new Mesh(shardGeo, new MeshBasicMaterial({ color: tones[i % tones.length], transparent: true, opacity: 0.8, toneMapped: false }));
      m.scale.setScalar(0.018 + rnd() * 0.03);
      const base = new Vector3((rnd() - 0.5) * 7, 0.8 + rnd() * 6, (rnd() - 0.5) * 5 - 1);
      m.position.copy(base);
      digital.add(m);
      shards.push({ m, base, ph: rnd() * 6.28 });
      disposables.push(m.material as MeshBasicMaterial);
    }
  }
  disposables.push(shardGeo);
  // Işık huzmesindeki toz
  const dustN = full ? 260 : 120;
  const dustPos = new Float32Array(dustN * 3);
  {
    let s = 9;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3] = (rnd() - 0.5) * 12;
      dustPos[i * 3 + 1] = rnd() * 8;
      dustPos[i * 3 + 2] = (rnd() - 0.5) * 9 - 1;
    }
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new Float32BufferAttribute(dustPos, 3));
  const dust = new Points(dustGeo, new PointsMaterial({ color: PALETTE.rose, size: 0.028, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }));
  scene.add(dust);
  disposables.push(dustGeo, dust.material as PointsMaterial);

  // ---- Kamera durumu ----
  const camState: CamState = { ...STATIONS[0].pose };
  let w = 1;
  let h = 1;
  let ptr: { x: number; y: number } | null = null;
  let pn = { x: 0, y: 0 };
  let pnS = { x: 0, y: 0 };
  let dragAz = 0;
  let dragEl = 0;
  let hover: ClassicPart | null = null;
  let hoverHold = 0;
  const ray = new Raycaster();
  const ndc = new Vector2();
  const touchTo = new Vector3();
  const touchPos = new Vector3();
  let touchTarget = 0;
  const aspectF = () => MathUtils.clamp(1.2 / Math.max(0.4, w / h), 1, 2.4); // dikey ekranda daha uzak

  let running = true;
  let lost = false;
  let lastTime = 0;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    opts.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const anchors: ClassicAnchor[] = STATIONS.slice(1).map(() => ({ x: 0, y: 0, on: false }));
  const v3 = new Vector3();
  const look = new Vector3();

  const castAt = (x: number, y: number) => {
    ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(hitMeshes.map((h2) => h2.mesh), false)[0] ?? null;
  };
  const partOf = (o: unknown) => hitMeshes.find((h2) => h2.mesh === o)?.part ?? null;

  function update(time: number, dt: number) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 3);
    pnS.x += (pn.x - pnS.x) * k;
    pnS.y += (pn.y - pnS.y) * k;
    const drift = reduce ? 0 : 1;
    const inOverview = camState.frame < 0.85;
    const par = inOverview ? 1 : 0.35;
    const az = camState.az + dragAz + pnS.x * 0.09 * par + Math.sin(time * 0.13) * 0.012 * drift;
    const el = camState.el + dragEl - pnS.y * 0.04 * par + Math.sin(time * 0.17) * 0.006 * drift;
    const dist = camState.dist * (inOverview ? aspectF() : Math.min(aspectF(), 1.6)) + Math.sin(time * 0.21) * 0.06 * drift;
    look.set(camState.tx, camState.ty, camState.tz);
    camera.fov = camState.fov;
    camera.position.set(look.x + Math.sin(az) * Math.cos(el) * dist, look.y + Math.sin(el) * dist, look.z + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(look);
    const wide = w >= 900;
    // Dikey ekran: genel görünümde sahne başlığın altına iner, odakta alt sayfanın üstüne çıkar.
    camera.setViewOffset(w, h, wide ? -w * 0.14 * camState.frame : 0, wide ? 0 : inOverview ? -h * 0.1 : h * 0.16 * camState.frame, w, h);
    camera.updateProjectionMatrix();

    // Hover: hangi parça (bust, sütun, kabartma)
    const hit = ptr ? castAt(ptr.x, ptr.y) : null;
    const part = hit ? partOf(hit.object) : null;
    if (part) {
      hover = part;
      hoverHold = 0.18;
    } else if (hoverHold > 0) hoverHold -= dt;
    else hover = null;
    if (hit && part && hit.face) {
      touchTo.copy(hit.point).addScaledVector(hit.face.normal.clone().transformDirection(hit.object.matrixWorld), 0.55);
      touchTarget = 1;
    } else if (!hover) touchTarget = 0;
    touchPos.lerp(touchTo, reduce ? 1 : 1 - Math.exp(-dt * 9));
    touch.position.copy(touchPos);
    touch.color.set(part === "column" ? PALETTE.sage : part === "relief" ? PALETTE.sky : PALETTE.blush);
    touch.intensity += (touchTarget * 7 - touch.intensity) * (reduce ? 1 : 1 - Math.exp(-dt * 6));

    // Kaydırmayla sürülen dağılma/dönme
    if (bustMesh) {
      bustMesh.rotation.y = camState.yaw + Math.sin(time * 0.11) * 0.03 * drift;
      bustMesh.position.y = BUST_Y + camState.lift;
    }
    if (capGroup) {
      capGroup.position.y = capY + camState.cap * 1.4;
      capGroup.rotation.y = camState.cap * 0.9;
    }
    if (panelMesh) panelMesh.position.z = RELIEF.z - 0.07 - camState.spread * 1.6;
    if (slabMesh) slabMesh.position.z = RELIEF.z - 0.3 - camState.spread * 2.4;
    // Gölge haritası statik; yalnızca bu değerler değişince bir kez yeniden üretilir.
    if (
      Math.abs(fxPrev.yaw - camState.yaw) > 1e-3 ||
      Math.abs(fxPrev.lift - camState.lift) > 1e-3 ||
      Math.abs(fxPrev.cap - camState.cap) > 1e-3 ||
      Math.abs(fxPrev.spread - camState.spread) > 1e-3
    ) {
      fxPrev.yaw = camState.yaw;
      fxPrev.lift = camState.lift;
      fxPrev.cap = camState.cap;
      fxPrev.spread = camState.spread;
      renderer.shadowMap.needsUpdate = true;
    }

    // Dijital katman
    rings.forEach((r, i) => {
      r.rotation.z += dt * 0.05 * (i % 2 ? 1 : -1) * drift;
      r.scale.setScalar(1 + camState.ring * (0.35 + i * 0.12));
    });
    // Yakın planda halkalar söner: yüzün ve kumaşın önünden çizgi geçmesin.
    const ringFade = MathUtils.smoothstep(camState.dist, 5, 10);
    rings.forEach((r, i) => ((r.material as MeshBasicMaterial).opacity = (0.5 - i * 0.1) * ringFade));
    shards.forEach((s) => {
      const sp = 1 + camState.ring * 0.4;
      s.m.position.set(s.base.x * sp + Math.sin(time * 0.12 + s.ph) * 0.2 * drift, s.base.y + Math.sin(time * 0.2 + s.ph * 2) * 0.18 * drift, s.base.z * sp);
      s.m.rotation.set(time * 0.2 * drift + s.ph, time * 0.15 * drift, 0);
    });
    dust.rotation.y = time * 0.01 * drift;
  }

  function computeAnchors() {
    STATIONS.slice(1).forEach((st, i) => {
      const a = anchors[i];
      if (!st.anchor) {
        a.on = false;
        return;
      }
      v3.set(st.anchor[0], st.anchor[1], st.anchor[2]).project(camera);
      a.x = (v3.x * 0.5 + 0.5) * w;
      a.y = (-v3.y * 0.5 + 0.5) * h;
      a.on = v3.z > -1 && v3.z < 1 && a.x > 0 && a.x < w && a.y > 0 && a.y < h;
    });
  }

  function render(time: number, dt: number) {
    if (lost) return;
    update(time, dt);
    renderer.render(scene, camera);
    computeAnchors();
  }

  // ---- Varlıklar ----
  let bustMat: MeshPhysicalMaterial | null = null;
  const texLoader = new TextureLoader();
  const loadTex = (url: string, srgb: boolean) =>
    new Promise<Texture>((res, rej) =>
      texLoader.load(
        url,
        (t) => {
          t.flipY = false; // glTF UV yönü
          t.anisotropy = 8;
          if (srgb) t.colorSpace = SRGBColorSpace;
          res(t);
        },
        undefined,
        rej,
      ),
    );
  const yieldFrame = () => new Promise<void>((r) => setTimeout(r, 0));

  const stoneMat = (kind: StoneKind, seed: number, rep: number, size: number, extra: Partial<MeshStandardMaterial> = {}) => {
    const t = stoneTextures(kind, seed, size);
    [t.map, t.rough, t.normal].forEach((x) => x.repeat.set(rep, rep));
    const m = new MeshStandardMaterial({ map: t.map, roughnessMap: t.rough, roughness: 1, normalMap: t.normal, normalScale: new Vector2(0.9, 0.9), metalness: 0, ...extra });
    disposables.push(m, t.map, t.rough, t.normal);
    return m;
  };

  async function load() {
    const base = "/models/marble-bust/";
    const res = full && w >= 900 ? "" : "-2k";
    // 1) Büst: geometri + dokular
    const gltf = await new GLTFLoader().loadAsync(base + "model.gltf");
    let geo: BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && !geo) geo = m.geometry;
    });
    if (!geo) throw new Error("bust geometry missing");
    const [dMap, nMap, rMap] = await Promise.all([loadTex(`${base}diff${full ? "-2k" : "-2k"}.webp`, true), loadTex(`${base}nor_gl-2k.webp`, false), loadTex(`${base}rough-2k.webp`, false)]);
    bustMat = new MeshPhysicalMaterial({ map: dMap, normalMap: nMap, normalScale: new Vector2(1.1, 1.1), roughnessMap: rMap, roughness: 1, metalness: 0, specularIntensity: 0.5 });
    const bust = new Mesh(geo, bustMat);
    bust.scale.setScalar(BUST_SCALE);
    bust.position.set(0, BUST_Y + 0.028 * BUST_SCALE * 0, 0);
    mark(bust, "bust");
    bustMesh = bust;
    scene.add(bust);
    disposables.push(geo, bustMat, dMap, nMap, rMap);
    await yieldFrame();

    // 2) Kaide
    const ped = new Mesh(pedestal(1.25, PED_H), stoneMat("carrara", 21, 1, 384));
    mark(ped, "pedestal");
    scene.add(ped);
    disposables.push(ped.geometry);
    await yieldFrame();

    // 3) Korint sütunu
    const colMat = stoneMat("ivory", 5, 2, 512);
    const colG = new Group();
    colG.position.set(COL.x, 0, COL.z);
    const R = COL.R;
    const baseM = new Mesh(columnBase(R), colMat);
    const plinth = new Mesh(new BoxGeometry(R * 3.4, 0.22, R * 3.4), colMat);
    plinth.position.y = -0.0;
    baseM.position.y = 0.22;
    const shaft = new Mesh(columnShaft(R, COL.shaft), colMat);
    shaft.position.y = 0.22 + 0.8;
    capY = 0.22 + 0.8 + COL.shaft;
    capGroup = null;
    const cap = corinthianCapital(R * 0.86);
    const capG = new Group();
    capG.position.y = capY;
    capGroup = capG;
    const bell = new Mesh(cap.bell, colMat);
    const abacus = new Mesh(cap.abacus, colMat);
    capG.add(bell, abacus);
    for (const p of cap.placements) {
      const outer = new Group();
      outer.rotation.y = Math.PI / 2 - p.angle;
      outer.position.set(Math.cos(p.angle) * p.r, p.y, Math.sin(p.angle) * p.r);
      const leaf = new Mesh(p.geo, colMat);
      colMat.side = DoubleSide;
      leaf.rotation.x = p.lean;
      outer.add(leaf);
      capG.add(outer);
      mark(leaf, "column");
    }
    for (const v of cap.volutes) {
      const tube = new Mesh(new TubeGeometry(new CatmullRomCurve3(v.path.map((p) => new Vector3(...p))), 70, v.radius, 10, false), colMat);
      capG.add(tube);
      mark(tube, "column");
      disposables.push(tube.geometry);
    }
    colG.add(plinth, baseM, shaft, capG);
    [plinth, baseM, shaft, bell, abacus].forEach((m) => mark(m, "column"));
    scene.add(colG);
    disposables.push(plinth.geometry, baseM.geometry, shaft.geometry, cap.bell, cap.abacus, ...cap.placements.map((p) => p.geo));
    // Başlığı hedefleyen kamera için işaret noktasını güncelle
    await yieldFrame();

    // 4) Barok kabartma paneli (arka duvar levhası + gerçek geometri kabartması)
    const wallMat = stoneMat("travertine", 9, 1.5, 512);
    const slab = new Mesh(new BoxGeometry(RELIEF.w + 0.9, RELIEF.h + 0.9, 0.4), wallMat);
    slab.position.set(RELIEF.x, RELIEF.y, RELIEF.z - 0.3);
    mark(slab, "relief");
    slabMesh = slab;
    scene.add(slab);
    const rel = baroqueRelief(3);
    const segsX = full ? 360 : 200;
    const segsY = Math.round(segsX * (RELIEF.h / RELIEF.w));
    const relMat = stoneMat("limestone", 33, 1, 512, { displacementMap: rel.height, displacementScale: 0.22, displacementBias: -0.02 });
    relMat.normalMap = rel.normal;
    relMat.normalScale.set(1.4, 1.4);
    const panel = new Mesh(new PlaneGeometry(RELIEF.w, RELIEF.h, segsX, segsY), relMat);
    panel.position.set(RELIEF.x, RELIEF.y, RELIEF.z - 0.07);
    mark(panel, "relief");
    panel.castShadow = false; // kabartma gölge haritasına girmez (160k köşe); detay normal haritasıyla okunur
    panelMesh = panel;
    scene.add(panel);
    disposables.push(slab.geometry, panel.geometry, rel.height, rel.normal);
    void res;
    renderer.shadowMap.needsUpdate = true;
  }

  // Yüksek çözünürlüklü dokuyu boşta yükle (LOD): 4k büst dokuları, yalnızca geniş ekran + full katmanda.
  async function upgradeBust() {
    if (!bustMat || !full || w < 900) return;
    try {
      const base = "/models/marble-bust/";
      const [d, n, r] = await Promise.all([loadTex(base + "diff.webp", true), loadTex(base + "nor_gl.webp", false), loadTex(base + "rough.webp", false)]);
      const old = [bustMat.map, bustMat.normalMap, bustMat.roughnessMap];
      bustMat.map = d;
      bustMat.normalMap = n;
      bustMat.roughnessMap = r;
      bustMat.needsUpdate = true;
      old.forEach((t) => t?.dispose());
    } catch {
      /* 2k ile devam */
    }
  }

  return {
    cam: camState,
    load: async () => {
      await load();
      void upgradeBust();
    },
    setPointer(x, y) {
      if (x === null) {
        ptr = null;
        pn = { x: 0, y: 0 };
        return;
      }
      ptr = { x, y };
      pn = { x: (x / w) * 2 - 1, y: (y / h) * 2 - 1 };
    },
    setDrag(dAz, dEl) {
      dragAz = MathUtils.clamp(dAz, -DRAG_LIMIT.az, DRAG_LIMIT.az);
      dragEl = MathUtils.clamp(dEl, -DRAG_LIMIT.el, DRAG_LIMIT.el);
    },
    drag: () => ({ az: dragAz, el: dragEl }),
    pick(x, y) {
      const hit = castAt(x, y);
      return hit ? partOf(hit.object) : null;
    },
    hovered: () => hover,
    anchors: () => anchors,
    tick(time, dt) {
      if (!running) return;
      lastTime = time;
      render(time, dt);
    },
    snap() {
      render(lastTime, 0.016);
    },
    resize(width, height) {
      w = Math.max(1, width);
      h = Math.max(1, height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      render(lastTime, 0.016);
    },
    setActive(a) {
      running = a;
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((d) => d.dispose());
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

export { Color };
