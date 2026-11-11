// Mikro dünya: Backend katmanındaki bir modülün içi (docs/micro-worlds.md).
//
// Sorumluluk sınırı: yalnızca Three.js nesneleri. DOM, React, GSAP ve scroll bilmez. Dışarıdan
// update(time, dt, params) ile sürülür; params'ı (open, rise, flow) GSAP zaman çizelgesi üretir.
//
// İçerik tamamen GENEL ve ÖZGÜN bir temsildir (content/microworld.ts disclaimer'ı): gerçek bir sistemin
// topolojisi değil, "bir isteğin servis içinden geçişi" fikrinin 3D çizimi.
//
//   01 API            giriş kapısı        (iki direk, lento, istek levhaları)
//   02 Kimlik doğ.    kontrol noktası     (kilit gövdesi, kilit kancası, bariyer direkleri)
//   03 İş mantığı     karar ve akış       (basamaklı pedler, karar elması, dönen dişli)
//   04 Veritabanı     kalıcı durum        (silindir istifi, nabız atan halka)
//
// Akış: alt hat = istek (aşağıdan yukarı ilerleyen paketler), üst yaylar = yanıt (geri dönen paketler).
// Yön, hem paket hareketiyle hem de ok başlarıyla okunur.

import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Line,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  QuadraticBezierCurve3,
  ShaderMaterial,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { MICRO } from "@/content/microworld";
import { PALETTE, THEMES, TONES } from "@/lib/design/palette";
import { currentTheme, onThemeChange, setSrgb } from "@/lib/design/theme";

export const MICRO_W = 10; // yerel platform genişliği
export const MICRO_D = 5;
/** GPU seçiminde servis kimlikleri bu değerden başlar (modül instance numaraları 1000'in altında kalır). */
export const MICRO_PICK_BASE = 1000;

const SVC_X = [-3.75, -1.25, 1.25, 3.75];
const SVC_Z = [0.8, -0.8, 0.8, -0.8];
const WALL_H = 1.6;

export interface MicroParams {
  open: number; // 0..1 kabuk açılması
  rise: number; // 0..1 servislerin yükselmesi
  flow: number; // 0..1 akış (paketler, oklar)
  animate: boolean; // false: reduced-motion, hareketsiz kare
}

const SURF_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

// Modül yüzeyleriyle aynı dil: katman tonu, anahtar ışık, sis. Hover/seçimde yüzey kremaya doğru açılır.
const SURF_FRAG = /* glsl */ `
uniform vec3 uTint;
uniform vec3 cInk;
uniform vec3 cAccent;
uniform vec3 cBg;
uniform float uHot;
uniform float uSel;
uniform float uAlpha;
uniform vec2 uFog;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 n = normalize(vN);
  float diff = max(dot(n, normalize(vec3(-0.45, 0.85, 0.55))), 0.0);
  float rim = max(dot(n, normalize(vec3(0.9, -0.35, 0.25))), 0.0);
  vec3 face = uTint * (0.82 + 0.26 * diff);
  face = mix(face, cInk, rim * 0.08);
  face = mix(face, cBg, uHot * 0.30 + uSel * 0.22);
  face = mix(face, cAccent, (uHot + uSel) * 0.10);
  face = mix(face, cBg, smoothstep(uFog.x, uFog.y, length(cameraPosition - vW)));
  gl_FragColor = vec4(face, uAlpha);
}
`;

// GPU seçimi: yalnızca kimlik (id+1, iki bayta bölünmüş). modules için olan pick shader'ıyla aynı kodlama.
const PICK_FRAG = /* glsl */ `
uniform float uId;
void main() {
  float id1 = uId + 1.0;
  gl_FragColor = vec4(mod(id1, 256.0) / 255.0, floor(id1 / 256.0) / 255.0, 0.0, 1.0);
}
`;
const PICK_VERT = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

interface Service {
  root: Group;
  meshes: Mesh[];
  edges: LineSegments[];
  surf: ShaderMaterial;
  pick: ShaderMaterial;
  line: LineBasicMaterial;
  hot: number;
  sel: number;
}

interface FlowDef {
  from: number;
  to: number;
  kind: "req" | "res";
  curve: QuadraticBezierCurve3;
  packets: number;
  speed: number;
}

export interface MicroWorld {
  group: Group;
  update(time: number, dt: number, p: MicroParams): void;
  setHover(i: number): void;
  setSelected(i: number): void;
  /** Servis etiketinin yerel (grup içi) bağlantı noktası. */
  anchor(i: number, out: Vector3): Vector3;
  /** Servisin yerel merkezi (kamera yaslanması için). */
  center(i: number, out: Vector3): Vector3;
  /** GPU seçimi için: servis yüzeylerini kimlik materyaline çevirir; kabuk, akış ve çizgiler gizlenir. */
  setPickMode(on: boolean): void;
  dispose(): void;
}

interface Deps {
  fog: { value: Vector2 };
}

export function createMicroWorld({ fog }: Deps): MicroWorld {
  const accent = new Vector3(0.706, 0.416, 0.447);
  const toVec = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };
  // Shader uniform'ları sRGB değeri (diğer sahnelerle aynı kural); kaynak: palette.ts THEMES.
  const ink = toVec(THEMES[currentTheme()].ink);
  const bg = toVec(THEMES[currentTheme()].bg);
  const inkColor = new Color(THEMES[currentTheme()].ink);
  // Mürekkep renginde sabit oluşturulan malzemeler: tema değişince hepsi güncellenir.
  const inkMats: { color: Color }[] = [];
  const accentColor = new Color(PALETTE.rose);

  const offTheme = onThemeChange((t) => {
    setSrgb(ink, THEMES[t].ink);
    setSrgb(bg, THEMES[t].bg);
    inkColor.set(THEMES[t].ink);
    inkMats.forEach((m) => m.color.copy(inkColor));
  });

  const geos: BufferGeometry[] = [];
  const g = <T extends BufferGeometry>(geo: T): T => {
    geos.push(geo);
    return geo;
  };

  const surfMat = (tint: Vector3) =>
    new ShaderMaterial({
      vertexShader: SURF_VERT,
      fragmentShader: SURF_FRAG,
      uniforms: {
        uTint: { value: tint },
        cInk: { value: ink },
        cAccent: { value: accent },
        cBg: { value: bg },
        uHot: { value: 0 },
        uSel: { value: 0 },
        uAlpha: { value: 1 },
        uFog: fog,
      },
    });
  const pickMat = (id: number) =>
    new ShaderMaterial({ vertexShader: PICK_VERT, fragmentShader: PICK_FRAG, uniforms: { uId: { value: id } } });

  const root = new Group();

  // ---- Servisler ---------------------------------------------------------------------------
  const services: Service[] = MICRO.services.map((def, i) => {
    const sroot = new Group();
    sroot.position.set(SVC_X[i], 0.07, SVC_Z[i]);
    const svc: Service = {
      root: sroot,
      meshes: [],
      edges: [],
      surf: surfMat(toVec(TONES[def.tone])),
      pick: pickMat(MICRO_PICK_BASE + i),
      line: new LineBasicMaterial({ color: inkColor.clone(), transparent: true, opacity: 0.8 }),
      hot: 0,
      sel: 0,
    };
    root.add(sroot);
    return svc;
  });

  /** Parça + kontur: kontur mesh'in çocuğudur, aynı dönüşümü taşır. */
  const part = (
    svc: Service,
    geo: BufferGeometry,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    edgeAngle = 25
  ): Mesh => {
    const m = new Mesh(g(geo), svc.surf);
    m.position.set(...pos);
    m.rotation.set(...rot);
    const e = new LineSegments(g(new EdgesGeometry(geo, edgeAngle)), svc.line);
    m.add(e);
    svc.root.add(m);
    svc.meshes.push(m);
    svc.edges.push(e);
    return m;
  };

  // 01 API: giriş kapısı. İki direk + lento; içinden geçen istek levhaları.
  const api = services[0];
  part(api, new BoxGeometry(0.2, 1.5, 0.2), [-0.65, 0.75, 0]);
  part(api, new BoxGeometry(0.2, 1.5, 0.2), [0.65, 0.75, 0]);
  part(api, new BoxGeometry(1.5, 0.22, 0.3), [0, 1.61, 0]);
  [0.3, 0.58, 0.86].forEach((y, k) => part(api, new BoxGeometry(0.9, 0.07, 0.44), [(k - 1) * 0.08, y, 0]));
  part(api, new CylinderGeometry(0.09, 0.09, 0.34, 10), [-0.95, 0.3, 0], [0, 0, Math.PI / 2]);

  // 02 Kimlik doğrulama: kontrol noktası. Kilit gövdesi + kanca + bariyer direkleri.
  const auth = services[1];
  part(auth, new BoxGeometry(1.0, 0.8, 0.55), [0, 0.4, 0]);
  const shackle = part(auth, new TorusGeometry(0.3, 0.075, 8, 20, Math.PI), [0, 0.8, 0]);
  part(auth, new CylinderGeometry(0.09, 0.09, 0.06, 12), [0, 0.45, 0.29], [Math.PI / 2, 0, 0]);
  [-0.72, 0.72].forEach((x) => part(auth, new CylinderGeometry(0.1, 0.1, 0.62, 12), [x, 0.31, 0.32]));
  void shackle;

  // 03 İş mantığı: karar ve akış. Basamaklı pedler + karar elması + dönen dişli.
  const logic = services[2];
  part(logic, new BoxGeometry(0.62, 0.16, 0.62), [-0.7, 0.08, 0.28]);
  part(logic, new BoxGeometry(0.62, 0.3, 0.62), [0, 0.15, -0.1]);
  part(logic, new BoxGeometry(0.62, 0.44, 0.62), [0.7, 0.22, 0.28]);
  part(logic, new BoxGeometry(0.5, 0.05, 0.1), [-0.35, 0.18, 0.1]);
  const diamond = part(logic, new BoxGeometry(0.55, 0.55, 0.55), [0, 0.74, -0.1], [0, Math.PI / 4, Math.PI / 4]);
  const gear = part(logic, new CylinderGeometry(0.36, 0.36, 0.16, 8), [0.7, 0.78, 0.28], [Math.PI / 2, 0, 0]);
  void diamond;

  // 04 Veritabanı: kalıcı durum. Silindir istifi + nabız atan halka.
  const db = services[3];
  [0.13, 0.43, 0.73, 1.03].forEach((y) => part(db, new CylinderGeometry(0.62, 0.62, 0.25, 28), [0, y, 0], [0, 0, 0], 30));
  part(db, new CylinderGeometry(0.34, 0.34, 0.09, 20), [0, 1.24, 0], [0, 0, 0], 30);
  const ring = part(db, new TorusGeometry(0.74, 0.035, 8, 40), [0, 1.42, 0], [Math.PI / 2, 0, 0]);

  // ---- Platform + açılan kabuk ---------------------------------------------------------------
  // Kapalıyken beş yüz bir kutu oluşturur (modülün kendisi); açılırken duvarlar menteşelerinde dışa yatar,
  // kapak yükselip kaybolur. Kabuk tonu Backend katmanının tonu (sage).
  const shellTint = toVec(TONES.sage);
  const shellSurf = surfMat(shellTint);
  const shellLine = new LineBasicMaterial({ color: inkColor.clone(), transparent: true, opacity: 0.75 });
  inkMats.push(shellLine);
  const shell = new Group();
  const shellMeshes: Mesh[] = [];
  const shellBox = (w: number, h: number, d: number, parent: Object3D, pos: [number, number, number]) => {
    const geo = g(new BoxGeometry(w, h, d));
    const m = new Mesh(geo, shellSurf);
    m.position.set(...pos);
    m.add(new LineSegments(g(new EdgesGeometry(geo)), shellLine));
    parent.add(m);
    shellMeshes.push(m);
    return m;
  };
  shellBox(MICRO_W, 0.14, MICRO_D, shell, [0, 0, 0]); // platform
  const mkPivot = (pos: [number, number, number]) => {
    const p = new Object3D();
    p.position.set(...pos);
    shell.add(p);
    return p;
  };
  const pivotFront = mkPivot([0, 0.07, MICRO_D / 2]);
  const pivotBack = mkPivot([0, 0.07, -MICRO_D / 2]);
  const pivotLeft = mkPivot([-MICRO_W / 2, 0.07, 0]);
  const pivotRight = mkPivot([MICRO_W / 2, 0.07, 0]);
  shellBox(MICRO_W, WALL_H, 0.1, pivotFront, [0, WALL_H / 2, 0]);
  shellBox(MICRO_W, WALL_H, 0.1, pivotBack, [0, WALL_H / 2, 0]);
  shellBox(0.1, WALL_H, MICRO_D, pivotLeft, [0, WALL_H / 2, 0]);
  shellBox(0.1, WALL_H, MICRO_D, pivotRight, [0, WALL_H / 2, 0]);
  const lid = shellBox(MICRO_W, 0.12, MICRO_D, shell, [0, WALL_H + 0.07, 0]);
  root.add(shell);

  // ---- Akış: yönlü yollar, paketler, ok başları ------------------------------------------------
  const P = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const flows: FlowDef[] = [
    // İstek: alt hat, API → Kimlik → İş mantığı → Veritabanı
    { from: 0, to: 1, kind: "req", curve: new QuadraticBezierCurve3(P(-3.0, 0.45, 0.8), P(-2.5, 1.0, 0.0), P(-2.0, 0.45, -0.8)), packets: 3, speed: 0.22 },
    { from: 1, to: 2, kind: "req", curve: new QuadraticBezierCurve3(P(-0.5, 0.45, -0.8), P(0.0, 1.0, 0.0), P(0.5, 0.45, 0.8)), packets: 3, speed: 0.22 },
    { from: 2, to: 3, kind: "req", curve: new QuadraticBezierCurve3(P(2.0, 0.45, 0.8), P(2.5, 1.0, 0.0), P(3.0, 0.45, -0.8)), packets: 3, speed: 0.22 },
    // Yanıt: üst yaylar, Veritabanı → İş mantığı → API
    { from: 3, to: 2, kind: "res", curve: new QuadraticBezierCurve3(P(3.75, 2.1, -0.8), P(2.5, 3.4, 0.0), P(1.25, 2.1, 0.8)), packets: 3, speed: 0.2 },
    { from: 2, to: 0, kind: "res", curve: new QuadraticBezierCurve3(P(1.25, 2.1, 0.8), P(-1.25, 3.8, 1.2), P(-3.75, 2.1, 0.8)), packets: 4, speed: 0.17 },
  ];
  const flowRoot = new Group();
  const flowLineMats: LineDashedMaterial[] = [];
  const flowLines: Line[] = [];
  flows.forEach((f) => {
    const geo = g(new BufferGeometry().setFromPoints(f.curve.getPoints(40)));
    const mat = new LineDashedMaterial({
      color: (f.kind === "req" ? accentColor : inkColor).clone(),
      dashSize: 0.14,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.55,
    });
    if (f.kind !== "req") inkMats.push(mat);
    const line = new Line(geo, mat);
    line.computeLineDistances();
    flowRoot.add(line);
    flowLineMats.push(mat);
    flowLines.push(line);
  });
  // Paketler: istek = vurgu rengi, yanıt = mürekkep. Tek InstancedMesh (iki çizim çağrısı).
  const reqCount = flows.filter((f) => f.kind === "req").reduce((a, f) => a + f.packets, 0);
  const resCount = flows.filter((f) => f.kind === "res").reduce((a, f) => a + f.packets, 0);
  const packetGeo = g(new BoxGeometry(0.1, 0.1, 0.1));
  const reqPackets = new InstancedMesh(packetGeo, new MeshBasicMaterial({ color: accentColor.clone() }), reqCount);
  const resPackets = new InstancedMesh(packetGeo, new MeshBasicMaterial({ color: inkColor.clone() }), resCount);
  reqPackets.frustumCulled = false;
  resPackets.frustumCulled = false;
  flowRoot.add(reqPackets, resPackets);
  inkMats.push(resPackets.material as MeshBasicMaterial);
  // Ok başları: yönü hareketsiz karede de okunur kılar.
  const arrowGeo = g(new ConeGeometry(0.085, 0.24, 10));
  const arrows: Mesh[] = flows.map((f) => {
    const m = new Mesh(arrowGeo, new MeshBasicMaterial({ color: (f.kind === "req" ? accentColor : inkColor).clone() }));
    if (f.kind !== "req") inkMats.push(m.material as MeshBasicMaterial);
    const pt = f.curve.getPoint(0.62);
    const tan = f.curve.getTangent(0.62);
    m.position.copy(pt);
    m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tan.normalize()); // koni +y'yi uç noktası yapar
    flowRoot.add(m);
    return m;
  });
  root.add(flowRoot);

  const dummy = new Object3D();
  const pt = new Vector3();
  const tan = new Vector3();
  const look = new Vector3();

  // ---- Durum -------------------------------------------------------------------------------
  let hoverIdx = -1;
  let selIdx = -1;
  let flowShown = false; // seçim modundan çıkınca akış grubunun önceki görünürlüğü
  const e3 = (t: number) => 1 - Math.pow(1 - t, 3);

  const world: MicroWorld = {
    group: root,

    update(time, dt, p) {
      const k = 1 - Math.exp(-dt * 10);
      // Hover/seçim yumuşatması + renk
      services.forEach((s, i) => {
        s.hot += ((i === hoverIdx ? 1 : 0) - s.hot) * k;
        s.sel += ((i === selIdx ? 1 : 0) - s.sel) * k;
        const u = s.surf.uniforms;
        u.uHot.value = s.hot;
        u.uSel.value = s.sel;
        s.line.color.copy(inkColor).lerp(accentColor, Math.min(1, s.hot * 0.8 + s.sel));
        s.line.opacity = 0.8 + 0.2 * Math.max(s.hot, s.sel);
      });

      // Kabuk: duvarlar menteşelerinde dışa yatar, kapak yükselip küçülerek kaybolur.
      const o = e3(MathUtils.clamp(p.open, 0, 1));
      const ang = o * 1.48;
      pivotFront.rotation.x = ang;
      pivotBack.rotation.x = -ang;
      pivotLeft.rotation.z = ang;
      pivotRight.rotation.z = -ang;
      lid.position.y = WALL_H + 0.07 + o * 3.2;
      lid.rotation.z = o * 0.35;
      const lidScale = 1 - MathUtils.smoothstep(o, 0.55, 1);
      lid.scale.set(Math.max(1e-3, lidScale), 1, Math.max(1e-3, lidScale));
      lid.visible = lidScale > 0.004;

      // Servisler sırayla yükselir (platformdan büyüyerek çıkar).
      services.forEach((s, i) => {
        const r = e3(MathUtils.clamp(p.rise * 1.7 - i * 0.22, 0, 1));
        s.root.scale.set(1, Math.max(1e-3, r), 1);
        s.root.visible = r > 0.004;
      });

      // Mikro hareketler: dişli döner, veritabanı halkası nabız atar.
      const live = p.animate ? p.flow : 0;
      gear.rotation.z = time * 0.9 * live;
      const pulse = 1 + 0.07 * Math.sin(time * 2.2) * live + 0.12 * services[3].hot;
      ring.scale.set(pulse, pulse, pulse);
      const dbH = Math.max(services[3].hot, services[3].sel);
      ring.position.y = 1.42 + dbH * 0.06 * Math.sin(time * 5) * live;

      // Akış
      const on = p.flow > 0.002;
      flowShown = on;
      flowRoot.visible = on;
      if (!on) return;
      let ri = 0;
      let si = 0;
      flows.forEach((f, fi) => {
        const lit = Math.max(services[f.from].hot, services[f.to].hot, services[f.from].sel, services[f.to].sel);
        const mat = flowLineMats[fi];
        mat.opacity = (0.35 + 0.5 * lit) * p.flow;
        const count = f.packets;
        for (let j = 0; j < count; j++) {
          const u = p.animate ? (time * f.speed * (1 + 0.8 * lit) + j / count) % 1 : (j + 0.5) / count;
          f.curve.getPoint(u, pt);
          f.curve.getTangent(u, tan);
          dummy.position.copy(pt);
          look.copy(pt).add(tan);
          dummy.lookAt(look);
          // Kenarlarda küçülerek belirir/kaybolur: paket "doğar ve söner" gibi okunur.
          const edge = Math.min(1, u * 8, (1 - u) * 8);
          dummy.scale.setScalar(Math.max(1e-3, p.flow * edge * (1 + 0.7 * lit)));
          dummy.updateMatrix();
          if (f.kind === "req") reqPackets.setMatrixAt(ri++, dummy.matrix);
          else resPackets.setMatrixAt(si++, dummy.matrix);
        }
        arrows[fi].scale.setScalar(Math.max(1e-3, p.flow * (1 + 0.5 * lit)));
      });
      reqPackets.instanceMatrix.needsUpdate = true;
      resPackets.instanceMatrix.needsUpdate = true;
    },

    setHover(i) {
      hoverIdx = i;
    },
    setSelected(i) {
      selIdx = i;
    },
    anchor(i, out) {
      return out.set(SVC_X[i], 2.45, SVC_Z[i]);
    },
    center(i, out) {
      return out.set(SVC_X[i], 0.9, SVC_Z[i]);
    },

    setPickMode(on) {
      shell.visible = !on;
      flowRoot.visible = !on && flowShown;
      services.forEach((s) => {
        s.meshes.forEach((m) => (m.material = on ? s.pick : s.surf));
        s.edges.forEach((e) => (e.visible = !on));
      });
    },

    dispose() {
      offTheme();
      geos.forEach((geo) => geo.dispose());
      services.forEach((s) => {
        s.surf.dispose();
        s.pick.dispose();
        s.line.dispose();
      });
      shellSurf.dispose();
      shellLine.dispose();
      flowLineMats.forEach((m) => m.dispose());
      (reqPackets.material as MeshBasicMaterial).dispose();
      (resPackets.material as MeshBasicMaterial).dispose();
      reqPackets.dispose();
      resPackets.dispose();
      arrows.forEach((a) => (a.material as MeshBasicMaterial).dispose());
      void flowLines;
      void shellMeshes;
    },
  };
  return world;
}
