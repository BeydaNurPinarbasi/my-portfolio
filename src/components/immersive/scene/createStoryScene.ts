// Hikâye sahnesi: hero sahnesiyle aynı yapı (aynı katmanlar, aynı shader), ancak scroll ilerlemesi
// yerine bir DURUM ile sürülür. Hangi bölümde hangi durumun olacağı burada değil,
// src/components/story/choreography.ts içinde (saf fonksiyon) tanımlıdır.
//
// Sorumluluk sınırı: burası DOM, React ve ScrollTrigger bilmez. setState() hedef verir;
// sahne her karede hedefe yumuşakça yaklaşır (scroll sıçramaları 3D'de sıçrama olmaz).

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
  WebGLRenderer,
} from "three";
import { gsap } from "gsap";
import { buildInstances, FIELD_NODES, formRadial } from "./layers";
import { CAPABILITIES } from "@/content/expertise";
import { DOMAIN_LINKS } from "@/content/domains";
import { PALETTE, TONES } from "@/lib/design/palette";
import { GROUND_FRAG, GROUND_VERT, LINK_FRAG, LINK_VERT, MODULE_FRAG, MODULE_VERT, SPINE_FRAG, SPINE_VERT } from "./shaders";

export type StorySceneTier = "full" | "lite" | "static";

/** Sahnenin tüm anlatı parametreleri. 0..1 olanlar morph ağırlığıdır. */
export interface SceneState {
  assemble: number; // parçaların yerine oturması
  compact: number; // katmanların sıkışması (çalışan tek yapı)
  explode: number; // katmanların ayrışması
  field: number; // alan takımyıldızı
  form: number; // ortak disk
  flow: number; // sistemden akan ışık darbeleri
  inspect: number; // aktif katmanın yapıdan kalkması
  calm: number; // hareketin ve ışığın sakinleşmesi
  active: number; // aktif katman (sürekli; < -1 = yok)
  yaw: number; // yapının dönüşü (radyan)
  lift: number; // kamera yüksekliği çarpanı
  zoom: number; // kamera uzaklığı çarpanı
  shiftX: number; // geniş ekranda yapının sağa kayması (0..1)
}

export interface StoryScene {
  setState(target: SceneState): void;
  /** Merakın Peşinde: üzerine gelinen alan (katman indeksi) ya da null. Aktif katmanı geçersiz kılar. */
  setFocus(layer: number | null): void;
  setPointer(x: number | null, y: number): void;
  pulse(): void;
  tick(timeSec: number, deltaSec: number): void;
  /** Reduced motion: hedefe yumuşatmadan atla ve tek kare çiz. */
  snap(): void;
  resize(width: number, height: number): void;
  setActive(active: boolean): void;
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
const C = { ink: srgb(PALETTE.midnight), accent: srgb(PALETTE.rose), bg: srgb(PALETTE.cream) };
const LAYER_TINTS = CAPABILITIES.map((c) => srgb(TONES[c.tone]));

const KEYS = Object.keys({
  assemble: 0, compact: 0, explode: 0, field: 0, form: 0, flow: 0, inspect: 0, calm: 0,
  active: 0, yaw: 0, lift: 0, zoom: 0, shiftX: 0,
} satisfies SceneState) as (keyof SceneState)[];

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
  const camera = new PerspectiveCamera(32, 1, 0.1, 90);
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

  const shared = {
    cInk: { value: C.ink },
    cAccent: { value: C.accent },
    cBg: { value: C.bg },
    uTime: { value: 0 },
    uAssemble: { value: 0 },
    uExplode: { value: 0 },
    uField: { value: 0 },
    uActive: { value: -3 },
    uSweep: { value: -6 },
    uFog: { value: new Vector2(12, 26) },
  };

  const moduleMat = new ShaderMaterial({
    vertexShader: MODULE_VERT,
    fragmentShader: MODULE_FRAG,
    defines: { STORY: 1 },
    transparent: true,
    uniforms: {
      ...shared,
      uPulse: { value: 0 },
      uTints: { value: LAYER_TINTS },
      uPointer: { value: new Vector3() },
      uPointerOn: { value: 0 },
      uCompact: { value: 0 },
      uForm: { value: 0 },
      uFormRadial: { value: formRadial(grid) },
      uInspect: { value: 0 },
      uCalm: { value: 0 },
      uFlow: { value: 0 },
    },
  });
  const modules = new Mesh(geometry, moduleMat);
  modules.frustumCulled = false; // konumlar GPU'da hesaplanıyor; sınır kutusu yanıltıcı
  group.add(modules);

  // ---- Zemin ------------------------------------------------------------------------------
  const groundMat = new ShaderMaterial({
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { ...shared },
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
    uniforms: { ...shared },
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
    uniforms: { ...shared },
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
  let sweepTween: gsap.core.Tween | null = null;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, onTarget: 0 };
  const pointerWorld = new Vector3();
  const tmp = new Vector3();
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

  function applyFrame(time: number) {
    const s = cur;
    const u = moduleMat.uniforms;
    shared.uTime.value = time;
    shared.uAssemble.value = s.assemble;
    shared.uExplode.value = s.explode;
    shared.uField.value = s.field;
    shared.uActive.value = s.active;
    u.uCompact.value = s.compact;
    u.uForm.value = s.form;
    u.uInspect.value = s.inspect;
    u.uCalm.value = s.calm;
    u.uFlow.value = s.flow;

    const aspect = width / height;
    const wide = aspect >= 1;
    const idle = Math.sin(time * 0.15) * 0.05 * (1 - s.calm);
    group.rotation.y = s.yaw + idle + pointer.x * 0.14;
    group.rotation.x = -0.04 + pointer.y * -0.05;
    // Geniş ekran: metin solda, yapı sağda. Dar ekran: yapı üst yarıda, metin altta.
    group.position.x = wide ? s.shiftX * 5 * Math.min(1, aspect / 1.6) : 0;
    group.position.y = wide ? 0.35 : 2.3;

    // Dar ekranda temel uzaklık zaten büyük (yatay görüş dar); anlatı yakınlaştırması yalnızca hafif uygulanır,
    // yoksa yapı ekranın üst yarısında kaybolur.
    const dist = baseDistance() * (wide ? s.zoom : 0.8 * (1 + (s.zoom - 1) * 0.4) * (1 + s.form * 0.22));
    camera.position.set(pointer.x * 0.55, 3.6 * s.lift + pointer.y * 0.3, dist);
    camera.lookAt(0, 0, 0);
    shared.uFog.value.set(dist * 0.9, dist * 2.0);

    if (pointer.on > 0.001) {
      tmp.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
      const t = -camera.position.z / tmp.z;
      pointerWorld.copy(camera.position).addScaledVector(tmp, t);
      modules.worldToLocal(pointerWorld);
      u.uPointer.value.copy(pointerWorld);
    }
    u.uPointerOn.value = pointer.on;
  }

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
    setState(next) {
      Object.assign(target, next);
    },
    setFocus(layer) {
      focus = layer;
    },
    setPointer(x, y) {
      if (x === null) {
        pointer.onTarget = 0;
        return;
      }
      pointer.tx = x;
      pointer.ty = y;
      pointer.onTarget = isFull ? 1 : 0;
    },
    pulse() {
      gsap.fromTo(moduleMat.uniforms.uPulse, { value: 1 }, { value: 0, duration: 1.3, ease: "power2.out" });
    },
    tick(time, delta) {
      if (disposed || !running) return;
      // Kare hızından bağımsız üstel yumuşatma. Biçim değişimleri yavaş (anlatı), aktif katman hızlı.
      const k = 1 - Math.exp(-delta * 3.2);
      const kFast = 1 - Math.exp(-delta * 7);
      for (const key of KEYS) {
        const goal = key === "active" && focus !== null ? focus : target[key];
        cur[key] += (goal - cur[key]) * (key === "active" ? kFast : k);
      }
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-delta * 5));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-delta * 5));
      pointer.on += (pointer.onTarget - pointer.on) * (1 - Math.exp(-delta * 6));

      applyFrame(time);
      renderer.render(scene, camera);

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
      applyFrame(0);
      renderer.render(scene, camera);
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
    dispose() {
      disposed = true;
      sweepTween?.kill();
      gsap.killTweensOf([shared.uSweep, moduleMat.uniforms.uPulse]);
      canvas.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      base.dispose();
      moduleMat.dispose();
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
