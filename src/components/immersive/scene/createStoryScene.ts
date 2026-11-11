// Hikâye sahnesi: hero sahnesiyle aynı yapı (aynı katmanlar, aynı shader), ancak scroll ilerlemesi
// yerine bir DURUM ile sürülür. Hangi bölümde hangi durumun olacağı burada değil,
// src/components/story/choreography.ts içinde (saf fonksiyon) tanımlıdır.
//
// Sorumluluk sınırı: burası DOM, React ve ScrollTrigger bilmez. setState() hedef verir;
// sahne her karede hedefe yumuşakça yaklaşır (scroll sıçramaları 3D'de sıçrama olmaz).
//
// Kamera (docs/motion-direction.md §2): bir hedef nokta etrafında küresel yörünge (azimut, yükseklik,
// uzaklık) + değişken FOV + lens kaydırması (kompozisyon) + el kamerası sürüklenmesi. Kamera aktif
// katmanı (follow) ya da içine dalınan modülü (nest) izleyebilir.

import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LineSegments,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { gsap } from "gsap";
import { buildInstances, FIELD_NODES, formRadial, LAYER_COUNT, SLAB_SIZE, sectorPoint } from "./layers";
import { CAPABILITIES } from "@/content/expertise";
import { DOMAIN_LINKS } from "@/content/domains";
import { PALETTE, THEMES, TONES } from "@/lib/design/palette";
import { currentTheme, onThemeChange, setSrgb } from "@/lib/design/theme";
import { createMicroWorld, MICRO_PICK_BASE, MICRO_W, MICRO_D } from "./micro";
import { GROUND_FRAG, GROUND_VERT, LINK_FRAG, LINK_VERT, MODULE_FRAG, MODULE_VERT, SPINE_FRAG, SPINE_VERT } from "./shaders";

export type StorySceneTier = "full" | "lite" | "static";

/** Sahnenin tüm anlatı parametreleri. 0..1 olanlar morph/karışım ağırlığıdır. */
export interface SceneState {
  // Yapı
  assemble: number; // parçaların yerine oturması
  compact: number; // katmanların sıkışması (çalışan tek yapı)
  explode: number; // katmanların ayrışması (exploded view)
  field: number; // alan takımyıldızı
  form: number; // ortak disk
  flow: number; // sistemden akan ışık darbeleri
  inspect: number; // aktif katmanın yapıdan kalkması
  calm: number; // hareketin ve ışığın sakinleşmesi
  active: number; // aktif katman (sürekli; < -1 = yok)
  behave: number; // aktif katmanın kendi davranış dili
  xray: number; // aktif olmayan katmanlar yalnızca çizgi
  blueprint: number; // teknik çizim görünümü
  nest: number; // sahne içinde sahne: kamera modüle dalar, içinde minyatür sistem kurulur
  yaw: number; // yapının kendi dönüşü (radyan)
  // Kamera
  camAz: number; // hedef etrafında azimut (radyan)
  camEl: number; // yükseklik açısı (radyan; ~1.4 = tepeden plan)
  camDist: number; // uzaklık (ekran oranına göre temel uzaklığın katı)
  fov: number; // dikey görüş açısı (derece): küçük = uzun lens, büyük = geniş açı
  tx: number; // kamera hedefi (yapı-yerel)
  ty: number;
  tz: number;
  follow: number; // 0..1 hedef yüksekliği aktif katmanı izler
  frame: number; // geniş ekranda yapının sağa kaydırılması (lens shift, 0..1)
  drift: number; // el kamerası sürüklenmesi (0..1)
}

/** Etiket bağlantı noktası: ekran pikseli; on = kameranın önünde ve görünür alanda. */
export interface Anchor {
  x: number;
  y: number;
  on: boolean;
}

/**
 * Mikro dünya geçişi. Bu nesneyi GSAP zaman çizelgesi (StoryStage) sürer; sahne yalnızca okur.
 * Kamera dahil tüm geçiş tek bir zaman çizelgesindedir: scroll ve tıklama animasyonları birbirine karışmaz
 * (scroll yalnızca `cur` durumunu, mikro dünya yalnızca bu nesneyi sürer; ikisi blend ile karışır).
 */
export interface MicroTransition {
  blend: number; // 0..1 kamera devri: katman kamerasından mikro kameraya
  dip: number; // 0..1 makro dalış: geçişin ortasında kamera modüle fazladan yaklaşır
  shrink: number; // 0..1 tıklanan modülün küçülüp yerini kabuğa bırakması
  k: number; // 0..1 kabuğun modül boyundan açık dünya boyuna büyümesi
  open: number; // 0..1 kabuğun açılması (duvarlar yatar, kapak kalkar)
  rise: number; // 0..1 servislerin yükselmesi
  flow: number; // 0..1 yönlü veri akışı
}

/** Ölçüm: yalnızca ?perf=1 ile görünür (StoryStage). */
export interface SceneStats {
  calls: number;
  triangles: number;
  programs: number; // derlenmiş shader programı sayısı (ısınma sonrası artmamalı)
  tickMs: number; // üstel ortalama: durum + kamera + render çağrısı (CPU)
  pickSubmitMs: number; // GPU seçimi: render komutlarını gönderme (CPU, eşzamanlı kısım)
  pickRttMs: number; // GPU seçimi: gönderimden sonuca (GPU + okuma)
  picks: number;
}

/** GPU seçimiyle bulunan, ekranda gerçekten imlecin altındaki öğe. */
export interface Hover {
  layer: number; // 0..4
  id: number; // modül instance numarası; plaka ise -1
  plate: boolean;
  amt: number; // 0..1 yumuşatılmış ağırlık
}

export interface StoryScene {
  setState(target: SceneState): void;
  /** Mikro dünya geçiş parametreleri (GSAP zaman çizelgesi bu nesneyi tween eder). */
  readonly micro: MicroTransition;
  /** Seçili servise kamera yaslanma ağırlığı (ayrı bir tween ile sürülür; zaman çizelgesine karışmaz). */
  readonly microSel: { v: number };
  /** Bir katmanın "en belirgin" modülü (klavyeyle/düğmeyle mikro dünyaya girmek için varsayılan). */
  defaultModule(layer: number): number;
  enterMicro(moduleId: number): void;
  exitMicro(): void;
  setMicroSelected(service: number): void;
  /** İkinci seviye hover: imlecin altındaki servis (0..3) ya da null. */
  microHovered(): number | null;
  /** İkinci seviye anlık seçim (dokunma / tıklama). */
  pickMicroAt(x: number, y: number): Promise<number | null>;
  stats(): SceneStats;
  gpu(): string;
  /**
   * Etkileşim: imleç konumu (canvas piksel) ve izinler. hover=false iken seçim çalışmaz.
   * parallax=false iken (hareket tercihi) yalnızca seçim açık kalabilir.
   */
  setInteraction(opts: { x: number | null; y: number; hover: boolean; parallax: boolean }): void;
  /** Sınırlı tilt hedefi (radyan): sürükleme. Sahne içinde clamp edilir ve yaylanarak 0'a döner. */
  setTilt(az: number, el: number): void;
  /** Anlık seçim (dokunmatik: dokunduğun yer). null = o noktada nesne yok. */
  pickAt(x: number, y: number): Promise<Hover | null>;
  /** Son hover sonucu (senkron). */
  hovered(): Hover | null;
  /** Merakın Peşinde: üzerine gelinen alan (katman indeksi) ya da null. Aktif katmanı geçersiz kılar. */
  setFocus(layer: number | null): void;
  setPointer(x: number | null, y: number): void;
  pulse(): void;
  tick(timeSec: number, deltaSec: number): void;
  /** Reduced motion: hedefe yumuşatmadan atla ve tek kare çiz. */
  snap(): void;
  resize(width: number, height: number): void;
  setActive(active: boolean): void;
  /** Son çizilen karedeki etiket noktaları (ekran pikseli): layer0..4, domain0..4, sector0..4, corner0..2, nest, core. */
  anchors(): Readonly<Record<string, Anchor>>;
  /** Sahnedeki modül sayısı (hero etiketindeki gerçek değer). */
  readonly moduleCount: number;
  /** Anlık kamera değerleri (derece): teknik okuma (HUD) için. */
  readout(): { az: number; el: number; fov: number };
  dispose(): void;
}

interface Options {
  tier: StorySceneTier;
  initial: SceneState;
  onContextLost?: () => void;
}

const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const C = { ink: srgb(THEMES[currentTheme()].ink), accent: srgb(PALETTE.rose), bg: srgb(THEMES[currentTheme()].bg) };
const LAYER_TINTS = CAPABILITIES.map((c) => srgb(TONES[c.tone]));

const KEYS = Object.keys({
  assemble: 0, compact: 0, explode: 0, field: 0, form: 0, flow: 0, inspect: 0, calm: 0, active: 0,
  behave: 0, xray: 0, blueprint: 0, nest: 0, yaw: 0, camAz: 0, camEl: 0, camDist: 0, fov: 0,
  tx: 0, ty: 0, tz: 0, follow: 0, frame: 0, drift: 0,
} satisfies SceneState) as (keyof SceneState)[];
const CAMERA_KEYS = new Set<keyof SceneState>(["camAz", "camEl", "camDist", "fov", "tx", "ty", "tz", "frame", "follow"]);

type LayerState = Pick<SceneState, "compact" | "explode" | "inspect" | "active">;
const activeness = (layer: number, s: LayerState) => 1 - MathUtils.smoothstep(Math.abs(layer - s.active), 0, 0.85);

/** Shader'daki katman konumu formülünün CPU kopyası (MODULE_VERT ile aynı tutulmalı). */
export function layerY(layer: number, s: LayerState): number {
  const gap = MathUtils.lerp(0.64, 0.24, s.compact) + s.explode * 1.5;
  return (2 - layer) * gap + s.inspect * activeness(layer, s) * 0.25;
}
/** İnceleme: aktif katmanın çekmece gibi yana kayması (yapı-yerel -x; inceleme açısında ekranın sağı). */
export function layerX(layer: number, s: LayerState): number {
  return -s.inspect * activeness(layer, s) * 3.4;
}

export function createStoryScene(canvas: HTMLCanvasElement, opts: Options): StoryScene {
  const { tier } = opts;
  const isFull = tier === "full";
  const isStatic = tier === "static";

  const renderer = new WebGLRenderer({ canvas, antialias: isFull, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  let dprCap = isFull ? 2 : 1.5;
  const applyDpr = () => renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  applyDpr();

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.05, 120);
  const group = new Group();
  scene.add(group);

  // ---- Modüller ---------------------------------------------------------------------------
  const grid = isFull ? 12 : 8;
  const data = buildInstances(grid);
  const base = new BoxGeometry(1, 1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.getAttribute("position"));
  geometry.setAttribute("normal", base.getAttribute("normal"));
  geometry.setAttribute("uv", base.getAttribute("uv"));
  geometry.setAttribute("aOffset", new InstancedBufferAttribute(data.offsets, 3));
  geometry.setAttribute("aScale", new InstancedBufferAttribute(data.scales, 3));
  geometry.setAttribute("aRand", new InstancedBufferAttribute(data.rands, 4));
  geometry.setAttribute("aLayer", new InstancedBufferAttribute(data.layers, 1));
  geometry.setAttribute("aField", new InstancedBufferAttribute(data.field, 4));
  geometry.setAttribute("aForm", new InstancedBufferAttribute(data.form, 4));
  geometry.instanceCount = data.count;
  const moduleCount = data.count - LAYER_COUNT; // plakalar hariç

  // Sahne içinde sahne: Mobil katmanının en uzun sütunu (merkeze yakın olanı) "içine girilen" modül.
  let nestId = -1;
  {
    let best = -Infinity;
    for (let i = 0; i < data.count; i++) {
      if (data.layers[i] !== 0 || data.scales[i * 3] > 4) continue;
      const score = data.scales[i * 3 + 1] * 4 - Math.hypot(data.offsets[i * 3], data.offsets[i * 3 + 2]);
      if (score > best) {
        best = score;
        nestId = i;
      }
    }
  }
  const nestBase = new Vector3(data.offsets[nestId * 3], 0, data.offsets[nestId * 3 + 2]);
  const nestHeight = data.scales[nestId * 3 + 1];

  const shared = {
    cInk: { value: C.ink },
    cAccent: { value: C.accent },
    cBg: { value: C.bg },
    uTime: { value: 0 },
    uSweep: { value: -6 },
    uFog: { value: new Vector2(12, 26) },
    uTints: { value: LAYER_TINTS },
    uBlueprint: { value: 0 },
  };
  // Ana sistemin durum uniform'ları. Minyatür kendi kopyasını kullanır.
  const structU = {
    uAssemble: { value: 0 },
    uExplode: { value: 0 },
    uField: { value: 0 },
    uActive: { value: -3 },
  };

  const moduleUniforms = (struct: typeof structU, hideId: number) => ({
    ...shared,
    ...struct,
    uPulse: { value: 0 },
    uPointer: { value: new Vector3() },
    uPointerOn: { value: 0 },
    uCompact: { value: 0 },
    uForm: { value: 0 },
    uFormRadial: { value: formRadial(grid) },
    uInspect: { value: 0 },
    uCalm: { value: 0 },
    uFlow: { value: 0 },
    uBehave: { value: 0 },
    uXray: { value: 0 },
    uHideId: { value: hideId },
    uNest: { value: 0 },
    uParallax: { value: new Vector3() },
    uHoverLayer: { value: -1 },
    uHoverId: { value: -1 },
    uHoverXZ: { value: new Vector2(99, 99) },
    uHoverAmt: { value: 0 },
    uMicroFade: { value: 0 },
  });

  const moduleMat = new ShaderMaterial({
    vertexShader: MODULE_VERT,
    fragmentShader: MODULE_FRAG,
    defines: { STORY: 1 },
    transparent: true,
    uniforms: moduleUniforms(structU, nestId),
  });
  const modules = new Mesh(geometry, moduleMat);
  modules.frustumCulled = false; // konumlar GPU'da hesaplanıyor; sınır kutusu yanıltıcı
  group.add(modules);

  // GPU seçimi: aynı vertex shader (aynı konumlar), yalnızca kimlik çıktısı. Uniform'lar paylaşılır.
  const pickMat = new ShaderMaterial({
    vertexShader: MODULE_VERT,
    fragmentShader: MODULE_FRAG,
    defines: { STORY: 1, PICK: 1 },
    uniforms: moduleMat.uniforms,
  });
  const pickTarget = new WebGLRenderTarget(1, 1);

  // Minyatür sistem: aynı geometri ve shader, ayrı durum. Modülün yerinde, onun ölçeğinde kurulur.
  const nestStruct = { uAssemble: { value: 0 }, uExplode: { value: 0.1 }, uField: { value: 0 }, uActive: { value: -3 } };
  const nestMat = new ShaderMaterial({
    vertexShader: MODULE_VERT,
    fragmentShader: MODULE_FRAG,
    defines: { STORY: 1 },
    transparent: true,
    uniforms: moduleUniforms(nestStruct, -1),
  });
  nestMat.uniforms.uFlow.value = 1; // içerideki sistem de çalışıyor
  nestMat.uniforms.uCompact.value = 0.3;
  const nested = new Mesh(geometry, nestMat);
  nested.frustumCulled = false;
  nested.visible = false;
  nested.scale.setScalar(0.085);
  group.add(nested);

  // ---- Mikro dünya (Backend modülünün içi) ---------------------------------------------------
  const world = createMicroWorld({ fog: shared.uFog });
  world.group.visible = false;
  group.add(world.group);
  const micro: MicroTransition = { blend: 0, dip: 0, shrink: 0, k: 0, open: 0, rise: 0, flow: 0 };
  const microSel = { v: 0 };
  let microModule = -1; // içine girilen modül (instance); -1 = mikro dünya kapalı
  let microSelIdx = -1;
  const microHover = { idx: -1, want: false, lastHit: 0 };
  // Kapalı kabuk, modülün ayak izine denk gelir (kare); açılınca platform oranına büyür.
  const K0X = (SLAB_SIZE / (isFull ? 12 : 8)) * 0.9 / MICRO_W;
  const K0Z = (SLAB_SIZE / (isFull ? 12 : 8)) * 0.9 / MICRO_D;
  const K_OPEN = 0.55;

  // ---- Zemin ------------------------------------------------------------------------------
  const groundMat = new ShaderMaterial({
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { ...shared, ...structU },
  });
  const ground = new Mesh(new PlaneGeometry(60, 60), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -5.6;
  ground.frustumCulled = false;
  scene.add(ground);

  // ---- Omurga (ayrışmış katmanları bağlar) ------------------------------------------------
  const spineGeo = new BufferGeometry();
  const h = 2.6;
  const spinePts: number[] = [];
  for (const [x, z] of [[-h, -h], [h, -h], [h, h], [-h, h]]) spinePts.push(x, -1, z, x, 1, z);
  spineGeo.setAttribute("position", new Float32BufferAttribute(spinePts, 3));
  const spineMat = new ShaderMaterial({
    vertexShader: SPINE_VERT,
    fragmentShader: SPINE_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: { ...shared, ...structU },
  });
  const spine = new LineSegments(spineGeo, spineMat);
  spine.frustumCulled = false;
  group.add(spine);

  // ---- Alan bağları (Merakın Peşinde) -----------------------------------------------------
  const linkPos: number[] = [];
  const linkT: number[] = [];
  const linkEnds: number[] = [];
  const addLink = (a: number, b: number) => {
    const pa = a < 0 ? [0, 0.2, 0] : FIELD_NODES[a];
    const pb = FIELD_NODES[b];
    linkPos.push(...pa, ...pb);
    linkT.push(0, 1);
    linkEnds.push(a, b, a, b);
  };
  FIELD_NODES.forEach((_, i) => addLink(-1, i)); // merkez (yazılım) -> her alan
  DOMAIN_LINKS.forEach(([a, b]) => addLink(a, b));
  const linkGeo = new BufferGeometry();
  linkGeo.setAttribute("position", new Float32BufferAttribute(linkPos, 3));
  linkGeo.setAttribute("aT", new Float32BufferAttribute(linkT, 1));
  linkGeo.setAttribute("aEnds", new Float32BufferAttribute(linkEnds, 2));
  const linkMat = new ShaderMaterial({
    vertexShader: LINK_VERT,
    fragmentShader: LINK_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: { ...shared, ...structU },
  });
  const links = new LineSegments(linkGeo, linkMat);
  links.frustumCulled = false;
  group.add(links);

  // ---- Durum ------------------------------------------------------------------------------
  const target: SceneState = { ...opts.initial };
  // Giriş: parçalar ilk karede dağınık başlar, hedefe yumuşakça yaklaşır.
  const cur: SceneState = { ...opts.initial, assemble: 0 };
  let focus: number | null = null;
  let width = 1;
  let height = 1;
  let running = true;
  let disposed = false;
  // Tema değişince ortak renk uniform'ları yerinde güncellenir; statik katmanda tek kare yeniden çizilir.
  const offTheme = onThemeChange((t) => {
    setSrgb(C.ink, THEMES[t].ink);
    setSrgb(C.bg, THEMES[t].bg);
    if (isStatic) api.snap();
  });
  let sweepTween: gsap.core.Tween | null = null;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, onTarget: 0 };
  const pointerWorld = new Vector3();
  const tmp = new Vector3();
  const v = new Vector3();
  const camDir = new Vector3();
  const camTarget = new Vector3();
  const anchorOut: Record<string, Anchor> = {};
  const mp = new Vector3(); // içine girilen modülün üst yüz merkezi (yapı-yerel)
  const mk = new Vector3(1, 1, 1); // kabuk ölçeği
  const mc = new Vector3();
  const camPos = new Vector3();
  const v0 = new Vector3();
  const v1 = new Vector3();
  let lastDt = 1 / 60;
  let gpuName = "bilinmiyor";
  const perf = { tickMs: 0, pickSubmitMs: 0, pickRttMs: 0, picks: 0, calls: 0, triangles: 0 };
  const ema = (prev: number, x: number) => (prev === 0 ? x : prev + (x - prev) * 0.1);
  // Etkileşim durumu
  const ix = { x: -1, y: -1, has: false, hover: false, parallax: false, moved: false };
  const tilt = { az: 0, el: 0, taz: 0, tel: 0 };
  const hover = { layer: -1, id: -1, plate: false, amt: 0, want: false, lastHit: 0 };
  let picking = false;
  let lastPick = 0;
  let viewOff = { x: 0, y: 0 };
  let sampleFrames = 0;
  let sampleTime = 0;
  let adapted = false;

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  function baseDistance() {
    return 13.5 * Math.max(1, 1.25 / (width / height)) ** 0.95;
  }

  /** İçine dalınan modülün üst yüz merkezi (yapı-yerel): minyatürün ve kamera hedefinin yeri. */
  function nestLocal(out: Vector3) {
    return out.set(nestBase.x, layerY(0, cur) + nestHeight, nestBase.z);
  }

  /** Yapı-yerel bir noktayı ekran pikseline izdüşürür (etiketler için). */
  function project(local: Vector3, id: string) {
    tmp.copy(local);
    group.localToWorld(tmp);
    projectWorld(tmp, id);
  }

  /** Dünya uzayındaki noktayı ekran pikseline izdüşürür (tmp yerinde değişir). */
  function projectWorld(w: Vector3, id: string) {
    if (w !== tmp) tmp.copy(w);
    const inFront = v.copy(tmp).sub(camera.position).dot(camDir) > 0;
    tmp.project(camera);
    const a = (anchorOut[id] ??= { x: 0, y: 0, on: false });
    a.x = (tmp.x * 0.5 + 0.5) * width;
    a.y = (-tmp.y * 0.5 + 0.5) * height;
    a.on = inFront && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02;
  }

  const p = new Vector3();
  function updateAnchors() {
    const s = cur;
    camera.getWorldDirection(camDir);
    for (let i = 0; i < LAYER_COUNT; i++) {
      // Katman: plakanın ön sağ köşesi (kamera dönünce yapıyla birlikte hareket eder).
      project(p.set(SLAB_SIZE / 2, layerY(i, s) + 0.05, SLAB_SIZE / 2), `layer${i}`);
      const [nx, ny, nz] = FIELD_NODES[i];
      project(p.set(nx, ny + 0.45, nz), `domain${i}`);
      // Disk dilimi: dilimin orta noktası.
      project(p.set(...sectorPoint(i)), `sector${i}`);
    }
    // Çekmece gibi dışarı çıkan katmanın üç köşesi (blueprint ölçü etiketleri).
    const y2 = layerY(2, s);
    const x2 = layerX(2, s);
    const c = SLAB_SIZE / 2;
    // Etiketler çekmecenin yapı dışında kalan kenarına bağlanır (x2 - c: dış kenar).
    project(p.set(x2 - c * 0.2, y2, c), "corner0");
    project(p.set(x2 - c, y2, 0), "corner1");
    project(p.set(x2 - c, y2, -c), "corner2");
    project(nestLocal(p), "nest");
    project(p.set(0, layerY(0, s) + 0.7, 0), "core");
    // Mikro dünya servis etiketleri: mikro yerel nokta -> yapı-yerel (kabuk ölçeği + konum) -> ekran.
    if (microModule >= 0) {
      for (let i = 0; i < 4; i++) {
        world.anchor(i, p);
        p.set(mp.x + p.x * mk.x, mp.y + p.y * mk.y, mp.z + p.z * mk.z);
        project(p, `svc${i}`);
      }
    }
  }

  function applyFrame(time: number) {
    const s = cur;
    const u = moduleMat.uniforms;
    shared.uTime.value = time;
    shared.uBlueprint.value = s.blueprint;
    structU.uAssemble.value = s.assemble;
    structU.uExplode.value = s.explode;
    structU.uField.value = s.field;
    structU.uActive.value = s.active;
    u.uCompact.value = s.compact;
    u.uForm.value = s.form;
    u.uInspect.value = s.inspect;
    u.uCalm.value = s.calm;
    u.uFlow.value = s.flow;
    u.uBehave.value = s.behave;
    u.uXray.value = s.xray;

    // Sahne içinde sahne: modül küçülür, yerinde minyatür sistem kurulur.
    const nestGrow = MathUtils.smoothstep(s.nest, 0.35, 1);
    // ---- Mikro dünya: modülün yerinde büyüyen iç dünya (docs/micro-worlds.md) --------------
    const microOn = microModule >= 0;
    if (microOn) {
      const li = data.layers[microModule];
      mp.set(
        data.offsets[microModule * 3] + layerX(li, s),
        layerY(li, s) + data.scales[microModule * 3 + 1],
        data.offsets[microModule * 3 + 2]
      );
      mk.set(MathUtils.lerp(K0X, K_OPEN, micro.k), MathUtils.lerp(K0X, K_OPEN, micro.k), MathUtils.lerp(K0Z, K_OPEN, micro.k));
      world.group.position.copy(mp);
      world.group.scale.copy(mk);
    }
    world.group.visible = microOn;
    // Tıklanan modül küçülür (mevcut gizleme mekanizması); geri kalan her şey hayalet çizgilere döner.
    u.uHideId.value = microOn ? microModule : nestId;
    u.uNest.value = microOn ? micro.shrink : nestGrow;
    u.uMicroFade.value = microOn ? MathUtils.smoothstep(micro.blend, 0.15, 0.7) : 0;
    if (microOn) {
      world.update(time, lastDt, { open: micro.open, rise: micro.rise, flow: micro.flow, animate: !isStatic });
      world.setHover(microHover.want ? microHover.idx : -1);
    }
    nested.visible = nestGrow > 0.001;
    if (nested.visible) {
      nestLocal(nested.position);
      nested.position.y -= nestHeight * 0.5;
      nestStruct.uAssemble.value = nestGrow;
    }

    const aspect = width / height;
    const wide = aspect >= 1;
    const drift = isStatic ? 0 : s.drift;
    // Yaşayan yapı: sakin olmayan bölümlerde yapı kendi etrafında çok yavaş salınır.
    const idle = isStatic ? 0 : Math.sin(time * 0.15) * 0.05 * (1 - s.calm);
    group.rotation.y = s.yaw + idle;

    // Kamera hedefi: durumdaki nokta; aktif katmanı (follow) ya da içine dalınan modülü (nest) izler.
    const followY = s.active > -1 ? layerY(s.active, s) : s.ty;
    const followX = s.active > -1 ? layerX(s.active, s) : s.tx;
    camTarget.set(MathUtils.lerp(s.tx, followX, s.follow), MathUtils.lerp(s.ty, followY, s.follow), s.tz);
    const toNest = MathUtils.smoothstep(s.nest, 0, 0.5);
    if (toNest > 0) camTarget.lerp(nestLocal(tmp), toNest);
    group.localToWorld(camTarget);

    // El kamerası: tekrar etmeyen, yumuşak sürüklenme (birkaç sinüsün toplamı).
    const dAz = drift * (Math.sin(time * 0.13) * 0.05 + Math.sin(time * 0.31 + 1.7) * 0.02);
    const dEl = drift * (Math.sin(time * 0.11 + 0.4) * 0.03 + Math.sin(time * 0.27) * 0.012);
    // Genel sahne tepkisi: imleç kamerayı ≤4° azimutta, ≤2.3° yükseklikte kaydırır (zarif, kontrollü).
    // Sürükleme tilt'i ayrıca eklenir ve burada tekrar sınırlanır.
    const calmK = 1 - s.calm * 0.5;
    const az = s.camAz + dAz + pointer.x * 0.07 * calmK + tilt.az;
    // Tam tepeden bakışta lookAt tekilleşir: yükseklik 83°'de sınırlanır.
    const el = MathUtils.clamp(s.camEl + dEl + pointer.y * 0.04 * calmK + tilt.el, -0.2, 1.45);
    // Dar ekranda temel uzaklık zaten büyük (yatay görüş dar); anlatı yakınlaştırması yumuşatılır,
    // disk biçiminde (geniş yapı) biraz daha uzaklaşılır.
    // Yakın planlar (camDist < 1) dar ekranda da yakın kalır: makro dalış mobilde de dalış olmalı.
    const narrowDist = s.camDist >= 1 ? 0.8 * (1 + (s.camDist - 1) * 0.55) * (1 + s.form * 0.22) : 0.8 * s.camDist;
    const dist = baseDistance() * (wide ? s.camDist : narrowDist);
    let fovNow = s.fov;
    camPos.set(
      camTarget.x + dist * Math.cos(el) * Math.sin(az),
      camTarget.y + dist * Math.sin(el),
      camTarget.z + dist * Math.cos(el) * Math.cos(az)
    );
    let fogDist = dist;
    const mb = microOn ? MathUtils.clamp(micro.blend, 0, 1) : 0;
    if (mb > 0.0005) {
      // Kamera devri (GSAP `blend`): katman kamerasından mikro kameraya. Hedef, yön ve uzaklık ayrı ayrı
      // karıştırılır (uzaklık logaritmik): düz bir kaydırma değil, modüle doğru bir dolly.
      mc.set(mp.x, mp.y + 0.9 * mk.y, mp.z);
      if (microSel.v > 0.001 && microSelIdx >= 0) {
        world.center(microSelIdx, v1);
        // Seçili servise yaslan: hedef %60 servise kayar.
        mc.lerp(v1.set(mp.x + v1.x * mk.x, mp.y + v1.y * mk.y, mp.z + v1.z * mk.z), 0.6 * microSel.v);
      }
      group.localToWorld(mc);
      const az1 = s.yaw + 0.25 + dAz * 0.5 + pointer.x * 0.07 * calmK + tilt.az;
      const el1 = MathUtils.clamp(0.5 + dEl + pointer.y * 0.04 * calmK + tilt.el, 0.1, 1.2);
      // Platform (10 yerel birim × 0.55) metin paneliyle paylaşılan alana sığmalı; dar ekranda daha uzak.
      const d1 = 11.5 * Math.max(1, 1.0 / aspect) * (1 - 0.4 * microSel.v);
      v0.copy(camPos).sub(camTarget);
      const len0 = Math.max(1e-3, v0.length());
      v0.divideScalar(len0);
      v1.set(Math.cos(el1) * Math.sin(az1), Math.sin(el1), Math.cos(el1) * Math.cos(az1));
      v0.lerp(v1, mb).normalize();
      // Makro dalış: geçişin ortasında kamera modüle fazladan yaklaşır, sonra dünya açılırken geri çekilir.
      const len = len0 * Math.pow(d1 / len0, mb) * (1 - 0.55 * micro.dip);
      camTarget.lerp(mc, mb);
      camPos.copy(camTarget).addScaledVector(v0, len);
      fovNow = MathUtils.lerp(s.fov, 34, mb);
      fogDist = len;
    }
    camera.fov = fovNow;
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    camera.near = Math.max(0.02, fogDist * 0.01);

    // Kompozisyon: yapıyı oynatmadan kadrajı kaydır (lens shift). Geniş: metin solda, konu sağda.
    // Dar: konu üst yarıda, metin kartı altta.
    const sx = wide ? MathUtils.lerp(s.frame, 0.5, mb) * 0.26 : 0;
    const sy = wide ? 0 : MathUtils.lerp(0.2, 0.3, mb); // dar ekranda konu üst yarıda; mikro dünyada biraz daha yukarıda
    // Kadraj da imleçle birkaç piksel kayar (ekran uzayı parallax'ı).
    viewOff = { x: -sx * width - pointer.x * 10 * calmK, y: sy * height + pointer.y * 7 * calmK };
    camera.setViewOffset(width, height, viewOff.x, viewOff.y, width, height);
    camera.updateProjectionMatrix();

    // Derinlik parallax'ı: ekran-sağ vektörü nesne uzayına çevrilir (yapının yaw'ı hesaba katılır).
    const rx = Math.cos(az);
    const rz = -Math.sin(az);
    const cy = Math.cos(-s.yaw);
    const sy2 = Math.sin(-s.yaw);
    const k = ix.parallax ? pointer.on * calmK : 0;
    const par = u.uParallax.value as Vector3;
    par.set((rx * cy + rz * sy2) * pointer.x * k, pointer.y * 0.55 * k, (-rx * sy2 + rz * cy) * pointer.x * k);

    shared.uFog.value.set(fogDist * 0.9, fogDist * 2.0);

    if (pointer.on > 0.001) {
      tmp.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
      const t = -camera.position.z / tmp.z;
      pointerWorld.copy(camera.position).addScaledVector(tmp, t);
      modules.worldToLocal(pointerWorld);
      u.uPointer.value.copy(pointerWorld);
    }
    u.uPointerOn.value = pointer.on;
  }

  function writeHover() {
    const u = moduleMat.uniforms;
    u.uHoverLayer.value = hover.layer;
    u.uHoverId.value = hover.plate ? -1 : hover.id;
    u.uHoverAmt.value = hover.amt;
    const xz = u.uHoverXZ.value as Vector2;
    if (hover.id >= 0 && !hover.plate) xz.set(data.offsets[hover.id * 3], data.offsets[hover.id * 3 + 2]);
    else xz.set(99, 99);
  }

  /**
   * GPU seçimi. Modüllerin konumu vertex shader'da hesaplandığı için (kurulum, davranış, morph) CPU raycast'i
   * gerçek konumu bilemez. Aynı shader'la yalnızca imlecin altındaki 1×1 pikseli kimlik rengiyle çizer ve
   * asenkron okuruz. Sonuç ekranda gerçekten görünen modüldür (docs/interaction-architecture.md §3.2).
   */
  /** İkinci seviye seçim aktif mi: mikro dünya kamerayı devralmış (hover/tıklama servislere gider). */
  const microPickable = () => microModule >= 0 && micro.blend > 0.5;

  async function pickPixel(px: number, py: number): Promise<{ id: number } | null> {
    const t0 = performance.now();
    const microMode = microPickable();
    const prevTarget = renderer.getRenderTarget();
    const prevAlpha = renderer.getClearAlpha();
    // Modül seviyesi: yalnızca modüller. Mikro seviye: yalnızca mikro dünya servisleri (aynı 1×1 hat, aynı kodlama;
    // kimlikler MICRO_PICK_BASE'den başlar, modül numaralarıyla çakışmaz).
    const hidden = microMode ? [ground, spine, links, nested, modules] : [ground, spine, links, nested, world.group];
    const vis = hidden.map((o) => o.visible);
    hidden.forEach((o) => (o.visible = false));
    if (microMode) {
      world.group.visible = true;
      world.setPickMode(true);
    } else modules.material = pickMat;
    // Seçim "dinlenme" geometrisinde yapılır: hover'ın kendi kaldırdığı/büyüttüğü modül seçimi etkilemesin
    // (geri besleme titremesini önler). Ağırlık render'dan hemen sonra geri yüklenir.
    const hoverAmtNow = moduleMat.uniforms.uHoverAmt.value as number;
    moduleMat.uniforms.uHoverAmt.value = 0;
    // 1×1 kesit: imlecin altındaki piksel (mevcut kadraj kaymasını koruyarak).
    camera.setViewOffset(width, height, viewOff.x + px, viewOff.y + py, 1, 1);
    camera.updateProjectionMatrix();
    renderer.setRenderTarget(pickTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    // Eski duruma dön.
    moduleMat.uniforms.uHoverAmt.value = hoverAmtNow;
    if (microMode) world.setPickMode(false);
    else modules.material = moduleMat;
    hidden.forEach((o, i) => (o.visible = vis[i]));
    if (microMode) world.group.visible = true;
    camera.setViewOffset(width, height, viewOff.x, viewOff.y, width, height);
    camera.updateProjectionMatrix();
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(0x000000, prevAlpha);

    const t1 = performance.now();
    // Her istek kendi tamponunu kullanır: eşzamanlı seçimler (hover + tıklama) birbirinin verisini ezmesin.
    const buf = new Uint8Array(4);
    try {
      await renderer.readRenderTargetPixelsAsync(pickTarget, 0, 0, 1, 1, buf);
    } catch {
      return null;
    }
    perf.pickSubmitMs = ema(perf.pickSubmitMs, t1 - t0);
    perf.pickRttMs = ema(perf.pickRttMs, performance.now() - t0);
    perf.picks++;
    const id1 = buf[0] + buf[1] * 256;
    return id1 > 0 ? { id: id1 - 1 } : null;
  }

  /** Mikro seviye sonucu: servis indeksi ya da null (modül kimliği, mikro seviyede yoksayılır). */
  const toService = (hit: { id: number } | null): number | null =>
    hit && hit.id >= MICRO_PICK_BASE && hit.id < MICRO_PICK_BASE + 4 ? hit.id - MICRO_PICK_BASE : null;

  function toHover(id: number): Hover {
    const plate = data.scales[id * 3] > 4;
    return { layer: data.layers[id], id: plate ? -1 : id, plate, amt: 1 };
  }

  /**
   * İmleç hareket ettiyse en çok ~20 Hz'de; durağansa (scroll ya da kamera yumuşaması altında altındaki
   * şey değişir) ~2.5 Hz'de seçim. Önceki istek bitmeden yenisi başlamaz.
   */
  function maybePick(time: number) {
    if (!ix.hover || !ix.has || picking) return;
    if (time - lastPick < (ix.moved ? 0.05 : 0.4)) return;
    ix.moved = false;
    picking = true;
    lastPick = time;
    const microMode = microPickable();
    pickPixel(ix.x, ix.y)
      .then((hit) => {
        if (disposed) return;
        if (microMode) {
          // İkinci seviye: aynı histerezis, servis hover'ı.
          const svc = toService(hit);
          if (svc !== null) {
            microHover.idx = svc;
            microHover.want = true;
            microHover.lastHit = performance.now();
          } else if (performance.now() - microHover.lastHit > 180) microHover.want = false;
          return;
        }
        if (hit) {
          const h = toHover(hit.id);
          hover.layer = h.layer;
          hover.id = h.id;
          hover.plate = h.plate;
          hover.want = true;
          hover.lastHit = performance.now();
        } else if (performance.now() - hover.lastHit > 180) {
          // Histerezis: kenarlarda anlık boşluklar hover'ı titretmesin.
          hover.want = false;
        }
      })
      .finally(() => {
        picking = false;
      });
  }

  /**
   * Shader'ları boşta, kullanıcı etkileşmeden ÖNCE derle. Aksi halde ilk hover seçimi (pick shader'ı) ve mikro
   * dünyaya ilk geçiş (yüzey/çizgi/paket shader'ları) derleme yüzünden 100+ ms takılır (ölçüldü).
   * compileAsync: KHR_parallel_shader_compile varsa ana iş parçacığını bloklamadan derler.
   */
  function warmShaders() {
    if (disposed) return;
    let prevTarget: WebGLRenderTarget | null | undefined;
    try {
      // 1) Görünür malzemeler, mikro dünya dahil.
      world.group.visible = true;
      renderer.compileAsync(scene, camera).catch(() => {});
      // 2) GPU seçimi malzemeleri (modül + mikro servis). Three, hedefi bir render target olan çizimler için
      // (çıktı renk uzayı farklı) AYRI bir shader programı üretir; bu yüzden ısınma da render target ile yapılır.
      // setRenderTarget aynı zamanda 1×1 hedefin framebuffer'ını ilk kullanımda değil şimdi oluşturur.
      modules.material = pickMat;
      world.setPickMode(true);
      prevTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(pickTarget);
      renderer.compileAsync(scene, camera).catch(() => {});
    } finally {
      if (prevTarget !== undefined) renderer.setRenderTarget(prevTarget);
      modules.material = moduleMat;
      world.setPickMode(false);
      world.group.visible = false;
    }
  }
  const warmTimer = window.setTimeout(() => {
    warmShaders();
    try {
      const gl = renderer.getContext();
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) gpuName = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
    } catch {
      /* bilinmiyor kalır */
    }
  }, 1500);

  function sweepLoop() {
    sweepTween?.kill();
    sweepTween = gsap.fromTo(
      shared.uSweep,
      { value: -6.5 },
      { value: 7.5, duration: 4.2, ease: "power1.inOut", repeat: -1, repeatDelay: 2.4 }
    );
  }
  if (!isStatic) sweepLoop();

  const api: StoryScene = {
    moduleCount,
    micro,
    microSel,
    defaultModule(layer) {
      let best = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < data.count; i++) {
        if (data.layers[i] !== layer || data.scales[i * 3] > 4) continue;
        const sc = data.scales[i * 3 + 1] * 4 - Math.hypot(data.offsets[i * 3], data.offsets[i * 3 + 2]);
        if (sc > bestScore) {
          bestScore = sc;
          best = i;
        }
      }
      return best;
    },
    enterMicro(id) {
      microModule = id;
      microSelIdx = -1;
      microHover.want = false;
      hover.want = false; // modül seviyesi hover sönsün
      world.setSelected(-1);
      world.group.visible = true;
    },
    exitMicro() {
      microModule = -1;
      microSelIdx = -1;
      microHover.want = false;
      microSel.v = 0;
      Object.assign(micro, { blend: 0, dip: 0, shrink: 0, k: 0, open: 0, rise: 0, flow: 0 });
      world.setSelected(-1);
      world.setHover(-1);
      world.group.visible = false;
    },
    setMicroSelected(i) {
      microSelIdx = i;
      world.setSelected(i);
    },
    microHovered() {
      return microPickable() && microHover.want ? microHover.idx : null;
    },
    async pickMicroAt(x, y) {
      if (disposed || !microPickable()) return null;
      const svc = toService(await pickPixel(x, y));
      if (svc !== null) {
        microHover.idx = svc;
        microHover.want = true;
        microHover.lastHit = performance.now();
      }
      return svc;
    },
    stats() {
      return { calls: perf.calls, triangles: perf.triangles, programs: renderer.info.programs?.length ?? 0, tickMs: perf.tickMs, pickSubmitMs: perf.pickSubmitMs, pickRttMs: perf.pickRttMs, picks: perf.picks };
    },
    gpu() {
      // Önbellekli: UNMASKED_RENDERER sorgusu GPU sürecine eşzamanlı gidiş-dönüş yaptırır; GPU doluyken ~100 ms
      // bekletir. Ölçüm kutusu bunu her 500 ms'de çağırınca kendi takılmalarını üretiyordu (ölçüldü).
      return gpuName;
    },
    setState(next) {
      Object.assign(target, next);
    },
    setFocus(layer) {
      focus = layer;
    },
    setInteraction(o) {
      ix.hover = o.hover;
      ix.parallax = o.parallax;
      if (o.x === null) {
        ix.has = false;
        hover.want = false;
        return;
      }
      if (o.x !== ix.x || o.y !== ix.y) ix.moved = true;
      ix.x = o.x;
      ix.y = o.y;
      ix.has = true;
      if (!o.hover) hover.want = false;
    },
    setTilt(az, el) {
      // Mutlak sınırlar: tam orbit yok (±21° azimut, ±7° yükseklik).
      tilt.taz = MathUtils.clamp(az, -0.37, 0.37);
      tilt.tel = MathUtils.clamp(el, -0.12, 0.12);
    },
    async pickAt(x, y) {
      if (disposed || microPickable()) return null;
      const hit = await pickPixel(x, y);
      if (!hit) return null;
      const h = toHover(hit.id);
      hover.layer = h.layer;
      hover.id = h.id;
      hover.plate = h.plate;
      hover.want = true;
      hover.lastHit = performance.now();
      return h;
    },
    hovered() {
      if (microPickable()) return null; // ikinci seviyede modül hover'ı yok; bkz. microHovered()
      return hover.layer >= 0 && hover.want ? { layer: hover.layer, id: hover.id, plate: hover.plate, amt: hover.amt } : null;
    },
    setPointer(x, y) {
      if (x === null) {
        pointer.onTarget = 0;
        return;
      }
      pointer.tx = x;
      pointer.ty = y;
      pointer.onTarget = ix.parallax || isFull ? 1 : 0;
    },
    pulse() {
      gsap.fromTo(moduleMat.uniforms.uPulse, { value: 1 }, { value: 0, duration: 1.3, ease: "power2.out" });
    },
    tick(time, delta) {
      if (disposed || !running) return;
      lastDt = delta;
      const tt0 = performance.now();
      // Kare hızından bağımsız üstel yumuşatma. Kamera biraz daha ağır (sinematik), aktif katman hızlı.
      const k = 1 - Math.exp(-delta * 3.2);
      const kCam = 1 - Math.exp(-delta * 2.4);
      const kFast = 1 - Math.exp(-delta * 7);
      for (const key of KEYS) {
        const goal = key === "active" && focus !== null ? focus : target[key];
        const rate = key === "active" ? kFast : CAMERA_KEYS.has(key) ? kCam : k;
        cur[key] += (goal - cur[key]) * rate;
      }
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-delta * 5));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-delta * 5));
      pointer.on += (pointer.onTarget - pointer.on) * (1 - Math.exp(-delta * 6));
      // Sürükleme tilt'i: hedefe yaylanır; hedef 0 olunca ~1 sn'de geri döner. Mutlak sınır: ±21° / ±7°.
      const kt = 1 - Math.exp(-delta * (tilt.taz === 0 && tilt.tel === 0 ? 3.2 : 9));
      tilt.az += (tilt.taz - tilt.az) * kt;
      tilt.el += (tilt.tel - tilt.el) * kt;
      hover.amt += ((hover.want ? 1 : 0) - hover.amt) * (1 - Math.exp(-delta * (hover.want ? 14 : 7)));
      if (!hover.want && hover.amt < 0.02) {
        hover.amt = 0;
        hover.layer = -1;
        hover.id = -1;
      }
      writeHover();

      applyFrame(time);
      renderer.render(scene, camera);
      perf.tickMs = ema(perf.tickMs, performance.now() - tt0);
      perf.calls = renderer.info.render.calls;
      perf.triangles = renderer.info.render.triangles;
      updateAnchors();
      maybePick(time);

      // Adaptif çözünürlük: kare süresi eşiği. Kesin FPS iddiası yok.
      if (!adapted && cur.assemble > 0.15) {
        sampleFrames++;
        sampleTime += delta;
        if (sampleFrames >= 90) {
          adapted = true;
          if (sampleTime / sampleFrames > 0.024 && dprCap > 1) {
            dprCap = 1;
            applyDpr();
            renderer.setSize(width, height, false);
          }
        }
      }
    },
    snap() {
      if (disposed) return;
      Object.assign(cur, target);
      if (focus !== null) cur.active = focus;
      shared.uSweep.value = -6; // ışık hattı sahne dışında
      lastDt = 1; // yumuşatmaları atla: tek kare
      applyFrame(0);
      renderer.render(scene, camera);
      updateAnchors();
    },
    resize(w, hh) {
      width = Math.max(1, w);
      height = Math.max(1, hh);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (isStatic) api.snap();
    },
    setActive(active) {
      running = active;
    },
    anchors() {
      return anchorOut;
    },
    readout() {
      // Gerçek kamera: durum + imleç kayması + sürükleme tilt'i.
      const k = 1 - cur.calm * 0.5;
      return {
        az: MathUtils.radToDeg(cur.camAz + cur.yaw + pointer.x * 0.07 * k + tilt.az),
        el: MathUtils.radToDeg(cur.camEl + pointer.y * 0.04 * k + tilt.el),
        fov: cur.fov,
      };
    },
    dispose() {
      disposed = true;
      offTheme();
      window.clearTimeout(warmTimer);
      sweepTween?.kill();
      gsap.killTweensOf([shared.uSweep, moduleMat.uniforms.uPulse]);
      canvas.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      base.dispose();
      moduleMat.dispose();
      pickMat.dispose();
      pickTarget.dispose();
      nestMat.dispose();
      world.dispose();
      ground.geometry.dispose();
      groundMat.dispose();
      spineGeo.dispose();
      spineMat.dispose();
      linkGeo.dispose();
      linkMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };

  return api;
}
