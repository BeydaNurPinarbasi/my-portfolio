// GLSL. Üç ShaderMaterial: modüller, zemin ızgarası, dikey omurga çizgileri.
// Three, ShaderMaterial'a WebGL2 öneklerini ekler (attribute/varying/gl_FragColor çalışır).
//
// STORY define'ı (createStoryScene) hikâye biçimlerini açar: field (takımyıldız), form (disk),
// compact/flow (çalışan sistem), inspect (tek katmanı inceleme), calm. Hero sahnesi bunları derlemez.
//
// Renk notu: ColorManagement kullanılmıyor; renkler doğrudan sRGB değeri olarak
// uniform'a verilir ve çıktı olduğu gibi yazılır (colorspace_fragment dahil edilmez).

export const MODULE_VERT = /* glsl */ `
attribute vec3 aOffset;
attribute vec3 aScale;
attribute vec4 aRand;
attribute float aLayer;
#ifdef STORY
attribute vec4 aField; // xyz küme merkezi, w ölçek
attribute vec4 aForm;  // x,z disk konumu, yaw, teğetsel genişlik (0 = gizli)
uniform float uCompact;
uniform float uField;
uniform float uForm;
uniform float uFormRadial;
uniform float uInspect;
uniform float uCalm;
varying float vDim;
#endif

uniform float uTime;
uniform float uAssemble;   // 0..1  kurulum
uniform float uExplode;    // 0..1  katmanların ayrışması
uniform float uActive;     // sürekli katman indeksi (-3 = hiçbiri)
uniform vec3  uPointer;    // nesne uzayında imleç noktası
uniform float uPointerOn;  // 0..1

varying vec3  vNormal;
varying vec3  vWorld;
varying vec2  vUv;
varying vec2  vFace;
varying float vT;
varying float vActive;
varying float vLayer;

vec3 rotY(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}

vec3 rotateAxis(vec3 v, vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}

void main() {
  // Katmanlar yukarıdan aşağı sırayla kurulur; her modülün ayrıca rastgele gecikmesi var.
  float stagger = aRand.x * 0.55 + aLayer * 0.04;
#ifdef STORY
  // Plakalar (zemin) en son oturur: önce parçalar bulunur, sonra üzerinde durdukları zemin.
  float isPlate = step(4.0, aScale.x);
  float t = clamp((uAssemble * (1.75 + 0.35 * isPlate) - stagger - 0.35 * isPlate), 0.0, 1.0);
#else
  float t = clamp((uAssemble * 1.75 - stagger), 0.0, 1.0);
#endif
  float e = 1.0 - pow(1.0 - t, 3.0);

  float act = 1.0 - smoothstep(0.0, 0.85, abs(aLayer - uActive));
  vec3 scl = aScale;
  float yaw = 0.0;
  float bob = 0.025;

#ifdef STORY
  // Üretim: katmanlar sıkışır (tek çalışan yapı). İnceleme: aktif katman yapıdan kalkar.
  float gap = mix(0.64, 0.24, uCompact) + uExplode * 1.5;
  float layerY = (2.0 - aLayer) * gap + uInspect * act * 0.95;
  vec3 target = vec3(aOffset.x, aOffset.y + layerY, aOffset.z);

  // Morph: katmanlı yığın -> alan kümeleri (field) -> ortak disk (form).
  target = mix(target, aField.xyz, uField);
  scl = mix(scl, aScale * aField.w, uField);
  // Diskte plakalar (aForm.w < 0) merkezde küçük bir katman çekirdeği olur: dilimlerin ortak merkezi.
  bool core = aForm.w < 0.0;
  vec3 formS = core ? aScale * vec3(0.36, 1.0, 0.36) : (aForm.w > 0.0 ? vec3(aForm.w, aScale.y, uFormRadial) : vec3(0.0));
  vec3 formT = core ? vec3(0.0, (2.0 - aLayer) * 0.08 + 0.1, 0.0) : vec3(aForm.x, aOffset.y, aForm.y);
  target = mix(target, formT, uForm);
  scl = mix(scl, formS, uForm);
  yaw = core ? 0.0 : aForm.z * uForm;
  bob *= 1.0 - uCalm * 0.8;
  // Yerine oturmamış parçalar küçük kalır; plakalar küçük karolar olarak süzülür (sahneyi kapatmasın).
  scl *= mix(mix(0.6, 0.14, isPlate), 1.0, e);
  vDim = uInspect * (1.0 - act);
#else
  float gap = 0.64 + uExplode * 1.5;
  float layerY = (2.0 - aLayer) * gap;
  vec3 target = vec3(aOffset.x, aOffset.y + layerY, aOffset.z);
#endif

  vec3 dir  = normalize(vec3(aRand.y - 0.5, aRand.z - 0.35, aRand.w - 0.5) + 1e-4);
  vec3 axis = normalize(vec3(aRand.z - 0.5, aRand.x - 0.5, aRand.w - 0.5) + 1e-4);
  vec3 start = target + dir * (5.5 + aRand.w * 7.0);

  float ang = (1.0 - e) * (aRand.y * 6.2832 + 3.0);
  vec3 local = rotateAxis(rotY(position * scl, yaw), axis, ang);
  vec3 nrm   = rotateAxis(rotY(normal, yaw), axis, ang);

  vec3 center = mix(start, target, e);
  // Düz çizgi yerine kavisli yol: kurulum "uçuşan parçalar" değil, bir yörünge gibi okunur.
  center += cross(axis, dir) * sin(e * 3.14159) * 1.4 * (1.0 - e);

#ifdef STORY
  // Henüz yerine oturmamış parçalar havada süzülür (merak: yol henüz bulunmamış).
  center += vec3(sin(uTime * 0.35 + aRand.x * 6.28), cos(uTime * 0.3 + aRand.y * 6.28) * 0.6, sin(uTime * 0.27 + aRand.z * 6.28)) * 0.35 * (1.0 - e);
#endif

  vec3 p = center + local;
  p.y += sin(uTime * 0.5 + aLayer * 1.7 + aOffset.x * 0.6 + aOffset.z * 0.4) * bob * e;

  // İmleç: yakındaki modüller izleyiciye doğru kabarır.
  float push = smoothstep(2.2, 0.0, length(p.xy - uPointer.xy)) * uPointerOn * e;
  p.z  += push * 0.55;
  p.xy += normalize(p.xy - uPointer.xy + 1e-4) * push * 0.18;

  vWorld  = (modelMatrix * vec4(p, 1.0)).xyz;
  vNormal = normalize(mat3(modelMatrix) * nrm);
  vUv = uv;

  // Kenar kalınlığını dünya biriminde ölçebilmek için yüz boyutu (BoxGeometry UV eşlemesi:
  // x yüzü -> (z,y), y yüzü -> (x,z), z yüzü -> (x,y)).
  vec3 an = abs(normal);
  vFace = an.x > 0.5 ? scl.zy : (an.y > 0.5 ? scl.xz : scl.xy);

  vLayer = aLayer;
  vActive = act;
  vT = t;
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
}
`;

export const MODULE_FRAG = /* glsl */ `
uniform float uSweep;  // ışık hattının dünya Y konumu
uniform float uPulse;  // dokunuş/tıklama darbesi
uniform vec3 cInk;
uniform vec3 cAccent;
uniform vec3 cBg;
uniform vec3 uTints[5]; // katman tonları = yetkinlik kategori renkleri (palette.ts)
#ifdef STORY
uniform float uTime;
uniform float uFlow;   // 0..1 sistem çalışıyor: yukarı akan ışık darbeleri
uniform float uCalm;   // 0..1 sakin sahne: ışık hattı söner
varying float vDim;
#endif
uniform vec2 uFog;     // sis başlangıç/bitiş mesafesi (kamera uzaklığına göre ölçeklenir)

varying vec3  vNormal;
varying vec3  vWorld;
varying vec2  vUv;
varying vec2  vFace;
varying float vT;
varying float vActive;
varying float vLayer;

void main() {
  vec3 n = normalize(vNormal);
  vec3 keyDir = normalize(vec3(-0.45, 0.85, 0.55));
  vec3 rimDir = normalize(vec3(0.9, -0.35, 0.25));
  float diff = max(dot(n, keyDir), 0.0);
  float rim  = max(dot(n, rimDir), 0.0);
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);

  // Pastel katı yüzey: her katman kendi kategori tonunu alır; ışık tonu koyulaştırıp açar.
  vec3 tint = uTints[int(clamp(floor(vLayer + 0.5), 0.0, 4.0))];
  vec3 face = tint * (0.80 + 0.26 * diff);
  face = mix(face, cInk, rim * 0.10);
  // Aktif katman koyulaşmaz, açılır: vurgu kenar çizgisinde, yüzey kremaya doğru parlar.
  face = mix(face, cBg, vActive * 0.22);

  // Kenar çizgisi (yüz UV'sinden, dünya biriminde kalınlık).
  float ed = min(min(vUv.x * vFace.x, (1.0 - vUv.x) * vFace.x),
                 min(vUv.y * vFace.y, (1.0 - vUv.y) * vFace.y));
  float w  = 0.011;
  float aa = fwidth(ed) * 1.25;
  float line = 1.0 - smoothstep(w, w + aa + 0.004, ed);

  // Işık hattı: dünya Y'de süpüren bant.
  float band = exp(-pow((vWorld.y - uSweep) * 1.4, 2.0));
  float flowLine = 0.0;
#ifdef STORY
  band *= 1.0 - uCalm * 0.75;
  float f = fract(vWorld.y * 0.32 - uTime * 0.5);
  flowLine = smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.05, 0.16, f)) * uFlow;
#endif

  vec3 edgeCol = mix(mix(cInk, tint, 0.45), cAccent, vActive);
  edgeCol = mix(edgeCol, cAccent, clamp(band * (0.8 + uPulse) + flowLine, 0.0, 1.0));

  face = mix(face, cBg, band * 0.45);
  vec3 col = mix(face, edgeCol, clamp(line * (0.6 + 0.4 * vActive + band + flowLine), 0.0, 1.0));
  col = mix(col, cBg, fres * 0.28);

  // Uzaklık sisi: arka katmanlar zemin rengine erir.
  float dist = length(cameraPosition - vWorld);
  col = mix(col, cBg, smoothstep(uFog.x, uFog.y, dist));

#ifdef STORY
  // İnceleme: aktif olmayan katmanlar zemine doğru soluklaşır.
  col = mix(col, cBg, vDim * 0.62);
#endif

  float a = smoothstep(0.0, 0.18, vT);
  gl_FragColor = vec4(col, a);
}
`;

export const GROUND_VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
}
`;

export const GROUND_FRAG = /* glsl */ `
uniform vec3 cInk;
uniform vec3 cAccent;
uniform float uAssemble;
uniform float uSweep;
varying vec3 vPos;

float gridLine(float x) {
  float g = abs(fract(x - 0.5) - 0.5) / fwidth(x);
  return 1.0 - min(g, 1.0);
}

void main() {
  float r = length(vPos.xz);
  float fade = 1.0 - smoothstep(2.0, 15.0, r);
  float minor = max(gridLine(vPos.x), gridLine(vPos.z));
  float major = max(gridLine(vPos.x * 0.2), gridLine(vPos.z * 0.2));
  float a = (minor * 0.16 + major * 0.34) * fade * smoothstep(0.35, 0.9, uAssemble);
  // Işık hattı yere değdiği an ızgara kısa süre vurgu rengine boyanır.
  float hit = exp(-pow((vPos.y - uSweep) * 1.2, 2.0));
  gl_FragColor = vec4(mix(cInk, cAccent, hit), a + hit * fade * 0.12);
}
`;

export const SPINE_VERT = /* glsl */ `
uniform float uExplode;
uniform float uAssemble;
varying float vAlpha;
void main() {
  float gap = 0.64 + uExplode * 1.5;
  vec3 p = position;
  p.y = position.y * (2.0 * gap + 0.35);
  vAlpha = uExplode * 0.55 * smoothstep(0.7, 1.0, uAssemble);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
}
`;

export const SPINE_FRAG = /* glsl */ `
uniform vec3 cAccent;
varying float vAlpha;
void main() { gl_FragColor = vec4(cAccent, vAlpha); }
`;

// Merakın Peşinde: alanlar arası bağlar. Her çizgi boyunca merkezden dışa akan ışık (bilgi paylaşımı).
export const LINK_VERT = /* glsl */ `
attribute float aT;     // çizgi boyunca 0..1
attribute vec2 aEnds;   // uç düğüm katmanları (merkez = -1)
uniform float uField;
uniform float uActive;
varying float vT;
varying float vFocus;
varying float vAlpha;
void main() {
  vT = aT;
  vFocus = (abs(aEnds.x - uActive) < 0.5 || abs(aEnds.y - uActive) < 0.5) ? 1.0 : 0.0;
  vAlpha = smoothstep(0.55, 1.0, uField);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

export const LINK_FRAG = /* glsl */ `
uniform vec3 cInk;
uniform vec3 cAccent;
uniform float uTime;
varying float vT;
varying float vFocus;
varying float vAlpha;
void main() {
  float d = fract(vT - uTime * 0.3);
  float dash = smoothstep(0.0, 0.04, d) * (1.0 - smoothstep(0.04, 0.14, d));
  vec3 col = mix(cInk, cAccent, max(dash, vFocus));
  gl_FragColor = vec4(col, vAlpha * (0.22 + 0.45 * vFocus + 0.5 * dash));
}
`;
