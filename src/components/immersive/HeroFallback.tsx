// Saf SVG izometrik kompozisyon. İki iş görür:
//  1) SSR'da ilk boyamada görünen yer tutucu (canvas hazır olana kadar; LCP/CLS güvenli),
//  2) WebGL2 yoksa / bağlam kaybolursa / JS çalışmazsa kalıcı görsel.
// Sunucu bileşeni olarak da çalışır (hook yok).

import { CAPABILITIES } from "@/content/expertise";
import { TONES } from "@/lib/design/palette";

const A = 150; // yarı yatay köşegen
const B = 86; // yarı dikey köşegen (30° izometri)
const T = 20; // kalınlık
const GAP = 66;
const LAYERS = CAPABILITIES.length;

function Slab({ i, active }: { i: number; active: boolean }) {
  const cx = 300;
  const cy = 128 + i * GAP;
  const top = `${cx},${cy - B} ${cx + A},${cy} ${cx},${cy + B} ${cx - A},${cy}`;
  const left = `${cx - A},${cy} ${cx},${cy + B} ${cx},${cy + B + T} ${cx - A},${cy + T}`;
  const right = `${cx},${cy + B} ${cx + A},${cy} ${cx + A},${cy + T} ${cx},${cy + B + T}`;
  const stroke = active ? "var(--imm-accent)" : "var(--imm-ink)";
  const op = active ? 0.95 : 0.32;
  const tone = TONES[CAPABILITIES[i].tone]; // 3D'deki katman tonuyla aynı

  // Üst yüzeyde modül ızgarası: iki yöndeki paralel çizgiler.
  const lines: string[] = [];
  for (let k = 1; k < 6; k++) {
    const f = k / 6;
    lines.push(
      `M${cx - A + A * f},${cy - B * f} L${cx + A * f},${cy + B - B * f}`, // sol-üst -> sağ-alt yönü
      `M${cx + A * f},${cy - B + B * f} L${cx - A + A * f},${cy + B * f}`
    );
  }

  return (
    <g strokeLinejoin="round" style={{ animationDelay: `${i * 140}ms` }} className="imm-fb-slab">
      {/* Yan yüzler aynı tonun gölgesi: midnight ile karıştırılır (3D'deki ışık mantığı) */}
      <polygon points={left} fill={`color-mix(in srgb, ${tone} 82%, var(--imm-ink))`} stroke={stroke} strokeOpacity={op * 0.8} strokeWidth="1" />
      <polygon points={right} fill={`color-mix(in srgb, ${tone} 70%, var(--imm-ink))`} stroke={stroke} strokeOpacity={op * 0.8} strokeWidth="1" />
      <polygon points={top} fill={tone} stroke={stroke} strokeOpacity={op} strokeWidth="1.2" />
      <path d={lines.join(" ")} stroke={stroke} strokeOpacity={op * 0.35} strokeWidth="0.8" fill="none" />
    </g>
  );
}

export default function HeroFallback({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {Array.from({ length: LAYERS }, (_, i) => (
        <Slab key={i} i={i} active={i === 1} />
      ))}
      {/* Dikey omurga: katmanları bağlar */}
      <path
        d={`M300,${128 - B} V${128 + (LAYERS - 1) * GAP + B + T}`}
        stroke="var(--imm-accent)"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="3 6"
      />
    </svg>
  );
}
