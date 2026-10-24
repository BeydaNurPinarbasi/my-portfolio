// Strata hero sahnesi: React'tan bağımsız, saf Three.js fabrikası.
//
// Sorumluluk sınırı (bkz. docs/creative-direction.md §9):
//  - Burası yalnızca WebGL'i bilir. DOM, React durumu ve ScrollTrigger bilmez.
//  - Dışarıdan setProgress/setPointer/pulse ile sürülür; tick() dışarıdaki
//    gsap.ticker tarafından çağrılır (tek zamanlayıcı, ScrollTrigger ile senkron).
//  - Giriş (kurulum) animasyonu uniform'lar üzerinde GSAP ile yapılır.

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
import { buildInstances, LAYER_COUNT } from "./layers";
import { CAPABILITIES } from "@/content/expertise";
import { PALETTE, TONES } from "@/lib/design/palette";
import {
  GROUND_FRAG,
  GROUND_VERT,
  MODULE_FRAG,
  MODULE_VERT,
  SPINE_FRAG,
  SPINE_VERT,
} from "./shaders";

export type HeroSceneTier = "full" | "lite" | "static";

export interface HeroScene {
  /** 0..1 scroll ilerlemesi (anında hedef; sahne kendi içinde yumuşatır). */
  setProgress(p: number): void;
  /** Normalize cihaz koordinatı -1..1; null = imleç yok. */
  setPointer(x: number | null, y: number): void;
  /** Işık hattı darbesi (dokunuş/tıklama). */
  pulse(): void;
  /** Dış zamanlayıcıdan her karede çağrılır. */
  tick(timeSec: number, deltaSec: number): void;
  /** Akıcı olmayan tek kare (reduced-motion ve yeniden boyutlandırma için). */
  renderOnce(): void;
  resize(width: number, height: number): void;
  /** Kurulum animasyonunu başlatır; static seviyede doğrudan tamamlanmış gösterir. */
  intro(): void;
  /** Sahne görünür mü? Görünmezken tick() maliyetsizdir. */
  setActive(active: boolean): void;
  dispose(): void;
}

interface Options {
  tier: HeroSceneTier;
  onContextLost?: () => void;
}

// Renkler sRGB değeri olarak (bkz. shaders.ts başlık notu). Kaynak: palette.ts.
const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const C = {
  ink: srgb(PALETTE.midnight), // mürekkep: kenar çizgileri
  accent: srgb(PALETTE.rose), // odak: aktif katman, ışık hattı
  bg: srgb(PALETTE.cream), // zemin: sis ve parlama hedefi
};
// Katman i'nin yüzey tonu = yetkinlik i'nin kategori rengi (listeyle aynı).
const LAYER_TINTS = CAPABILITIES.map((c) => srgb(TONES[c.tone]));

const smoothstep = MathUtils.smoothstep;

export function createHeroScene(canvas: HTMLCanvasElement, opts: Options): HeroScene {
  const { tier } = opts;
  const isFull = tier === "full";
  const isStatic = tier === "static";

  const renderer = new WebGLRenderer({
    canvas,
    antialias: isFull,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  let dprCap = isFull ? 2 : 1.5;
  const applyDpr = () => renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  applyDpr();

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 80);
  const group = new Group();
  scene.add(group);

  // ---- Modüller (tek instanced draw call) -------------------------------------------------
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
  geometry.instanceCount = data.count;

  const shared = {
    cInk: { value: C.ink },
    cAccent: { value: C.accent },
    cBg: { value: C.bg },
    uAssemble: { value: 0 },
    uExplode: { value: 0 },
    uSweep: { value: -6 },
    uFog: { value: new Vector2(12, 26) },
  };

  const moduleMat = new ShaderMaterial({
    vertexShader: MODULE_VERT,
    fragmentShader: MODULE_FRAG,
    transparent: true,
    uniforms: {
      ...shared,
      uTime: { value: 0 },
      uActive: { value: -3 },
      uPulse: { value: 0 },
      uTints: { value: LAYER_TINTS },
      uPointer: { value: new Vector3() },
      uPointerOn: { value: 0 },
    },
  });
  const modules = new Mesh(geometry, moduleMat);
  // Vertex shader geometriyi GPU'da taşıdığı için sınır kutusu yanıltıcı: culling kapalı.
  modules.frustumCulled = false;
  group.add(modules);

  // ---- Zemin ızgarası ---------------------------------------------------------------------
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

  // ---- Omurga çizgileri (katmanları birbirine bağlar) -------------------------------------
  const spineGeo = new BufferGeometry();
  const h = 2.6;
  const spinePts: number[] = [];
  for (const [x, z] of [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ]) {
    spinePts.push(x, -1, z, x, 1, z);
  }
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

  // ---- Durum ------------------------------------------------------------------------------
  let width = 1;
  let height = 1;
  let progressTarget = 0;
  let progress = 0;
  let activeSmooth = -3;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, onTarget: 0 };
  let running = true;
  let disposed = false;
  let sweepTween: gsap.core.Tween | null = null;
  let introTween: gsap.core.Tween | null = null;
  // Kurulum animasyonu ilk RENDER EDİLEN kareden sonra başlar: ilk karede shader derlemesi
  // (yavaş GPU'da saniyeler sürebilir) animasyonun görünmeden bitmesine yol açmasın.
  let introPending = false;
  const pointerWorld = new Vector3();
  const tmp = new Vector3();

  // Yavaş cihazlarda çözünürlüğü düşür. Kesin FPS iddiası yok: sadece kare süresi eşiği.
  let sampleFrames = 0;
  let sampleTime = 0;
  let adapted = false;

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  function layout() {
    const aspect = width / height;
    camera.aspect = aspect;
    // Dar ekranda yapı yatayda sığsın diye kamerayı uzaklaştır (yatay görüş alanı aspect ile küçülür).
    const dist = 13.5 * Math.max(1, 1.25 / aspect) ** 0.95;
    camera.position.z = dist;
    // Sis, kamera uzaklığıyla birlikte ölçeklenir; yoksa uzaklaşınca yapı tamamen erir.
    shared.uFog.value.set(dist * 0.9, dist * 2.0);
    camera.updateProjectionMatrix();
  }

  function applyFrame(time: number) {
    const u = moduleMat.uniforms;
    u.uTime.value = time;

    // Smooth ilerleme: scroll sıçramaları 3D'ye sıçrama olarak yansımasın.
    const p = progress;
    shared.uExplode.value = smoothstep(p, 0.06, 0.3);

    const gap = 0.64 + shared.uExplode.value * 1.5;
    const aspect = width / height;
    const wide = aspect >= 1;

    // Katman aktifleştirme: 0.28–0.92 aralığında 5 katman sırayla.
    const stepping = p > 0.27;
    const activeTarget = stepping ? MathUtils.clamp(((p - 0.28) / 0.64) * LAYER_COUNT - 0.5, 0, LAYER_COUNT - 1) : -3;
    activeSmooth += (activeTarget - activeSmooth) * (stepping ? 0.12 : 0.2);
    u.uActive.value = activeSmooth;

    // Yapı: scroll'la dönerken fareye de yönelir.
    const idle = Math.sin(time * 0.15) * 0.05;
    group.rotation.y = 0.45 + p * 1.15 + pointer.x * 0.14 + idle;
    group.rotation.x = -0.04 + pointer.y * -0.05;

    // Listeye yer aç: geniş ekranda yapı sağa, dar ekranda yukarı kayar.
    const shift = smoothstep(p, 0.2, 0.36);
    group.position.x = wide ? (1.5 + shift * 0.6) * Math.min(1, aspect / 1.6) : 0;
    group.position.y = wide ? 0.35 : shift * 1.9 + 0.6;

    // Kamera aktif katmanı takip eder.
    const hasActive = activeSmooth > -0.75;
    const activeY = hasActive ? (2 - activeSmooth) * gap : 0;
    const focusY = activeY * 0.5;
    camera.position.x = pointer.x * 0.55;
    // Yüksek kamera: katman desenleri (telefon, tarayıcı, raflar...) üstten okunabilsin.
    camera.position.y = 3.6 + focusY * 0.9 + pointer.y * 0.3;
    camera.lookAt(0, focusY, 0);

    // Finalde yapı geri çekilir ve sonraki sahneye devreder.
    const out = smoothstep(p, 0.93, 1);
    group.scale.setScalar(1 - out * 0.28);
    group.position.z = -out * 4;

    // İmleç: kamera ışınını z=0 düzlemine kes, nesne uzayına çevir.
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

  const api: HeroScene = {
    setProgress(p) {
      progressTarget = MathUtils.clamp(p, 0, 1);
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
      gsap.killTweensOf(shared.uSweep);
      sweepTween?.kill();
      gsap.fromTo(
        shared.uSweep,
        { value: 6.5 },
        { value: -6.5, duration: 1.3, ease: "power2.inOut", onComplete: sweepLoop }
      );
      gsap.fromTo(moduleMat.uniforms.uPulse, { value: 1 }, { value: 0, duration: 1.3, ease: "power2.out" });
    },
    tick(time, delta) {
      if (disposed || !running) return;

      // Yumuşatma: kare hızından bağımsız (delta tabanlı üstel yaklaşım).
      const k = 1 - Math.exp(-delta * 7);
      progress += (progressTarget - progress) * k;
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-delta * 5));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-delta * 5));
      pointer.on += (pointer.onTarget - pointer.on) * (1 - Math.exp(-delta * 6));

      applyFrame(time);
      renderer.render(scene, camera);

      if (introPending) {
        introPending = false;
        introTween = gsap.to(shared.uAssemble, {
          value: 1,
          duration: 2.8,
          delay: 0.15,
          ease: "power2.inOut",
          onComplete: sweepLoop,
        });
      }

      // Adaptif çözünürlük: kurulumdan sonraki ilk ~90 karenin ortalaması.
      if (!adapted && shared.uAssemble.value >= 1) {
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
    renderOnce() {
      if (disposed) return;
      progress = progressTarget;
      applyFrame(0.0);
      renderer.render(scene, camera);
    },
    resize(w, hh) {
      width = Math.max(1, w);
      height = Math.max(1, hh);
      renderer.setSize(width, height, false);
      layout();
      if (isStatic) api.renderOnce();
    },
    intro() {
      if (isStatic) {
        // Reduced motion: kurulmuş, hafif ayrışmış tek kompozisyon.
        shared.uAssemble.value = 1;
        progressTarget = 0.12;
        api.renderOnce();
        return;
      }
      introTween?.kill();
      introPending = true; // asıl başlatma tick() içinde, ilk kare çizildikten sonra
    },
    setActive(active) {
      running = active;
    },
    dispose() {
      disposed = true;
      introTween?.kill();
      sweepTween?.kill();
      gsap.killTweensOf([shared.uSweep, shared.uAssemble, moduleMat.uniforms.uPulse]);
      canvas.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      base.dispose();
      moduleMat.dispose();
      ground.geometry.dispose();
      groundMat.dispose();
      spineGeo.dispose();
      spineMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };

  return api;
}
