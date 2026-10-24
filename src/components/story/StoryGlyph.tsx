// Saf SVG: 3D sahnenin her biçiminin statik karşılığı. Üç iş görür:
//  1) WebGL yoksa / JS yoksa ana sayfa sahnesinin yerini tutar (aynı anlam, aynı renkler),
//  2) Hakkımda sayfasında WebGL'siz görsel dil,
//  3) SSR'da ilk boyama (LCP güvenli).
// Sunucu bileşeni (hook yok).

import { CAPABILITIES } from "@/content/expertise";
import { TONES } from "@/lib/design/palette";

export type GlyphVariant = "scatter" | "stack" | "field" | "compact" | "layers" | "inspect" | "calm" | "disc";

const TINTS = CAPABILITIES.map((c) => TONES[c.tone]);
const CX = 200;
// SVG koordinatları yuvarlanır: sunucu ve tarayıcı trigonometrinin son basamağında ayrışabilir (hydration).
const r1 = (n: number) => Math.round(n * 10) / 10;

function Slab({ x, y, a, t = 7, tone, op = 1, accent = false }: { x: number; y: number; a: number; t?: number; tone: string; op?: number; accent?: boolean }) {
  const b = a * 0.577;
  const top = `${x},${y - b} ${x + a},${y} ${x},${y + b} ${x - a},${y}`;
  const left = `${x - a},${y} ${x},${y + b} ${x},${y + b + t} ${x - a},${y + t}`;
  const right = `${x},${y + b} ${x + a},${y} ${x + a},${y + t} ${x},${y + b + t}`;
  const stroke = accent ? "var(--imm-accent)" : "var(--imm-ink)";
  return (
    <g opacity={op} strokeLinejoin="round" strokeWidth="1" stroke={stroke} strokeOpacity={accent ? 0.9 : 0.35}>
      <polygon points={left} fill={`color-mix(in srgb, ${tone} 82%, var(--imm-ink))`} />
      <polygon points={right} fill={`color-mix(in srgb, ${tone} 70%, var(--imm-ink))`} />
      <polygon points={top} fill={tone} />
    </g>
  );
}

function Stack({ gap, a = 120, y0 = 110, inspect = -1 }: { gap: number; a?: number; y0?: number; inspect?: number }) {
  // Alttan üste çizilir: üstteki katman alttakinin önünde kalır.
  return (
    <>
      {TINTS.map((tone, i) => ({ tone, i }))
        .reverse()
        .map(({ tone, i }) => {
          const lifted = i === inspect;
          return (
            <Slab
              key={i}
              x={CX + (lifted ? 46 : 0)}
              y={y0 + i * gap - (lifted ? 54 : 0)}
              a={a}
              tone={tone}
              op={inspect >= 0 && !lifted ? 0.4 : 1}
              accent={lifted}
            />
          );
        })}
    </>
  );
}

const SCATTER: [number, number, number][] = [
  [92, 96, 40],
  [282, 74, 30],
  [318, 214, 46],
  [118, 268, 34],
  [214, 318, 26],
];

const NODES = TINTS.map((_, i) => {
  const ang = (i / TINTS.length) * Math.PI * 2 + 0.35;
  return [r1(CX + Math.cos(ang) * 138), r1(200 + Math.sin(ang) * 80 - [26, -10, 16, -22, 4][i])] as const;
});

function Disc() {
  const rx = 160;
  const ry = 92;
  const cy = 206;
  const pt = (a: number, dy = 0) => `${r1(CX + rx * Math.cos(a))},${r1(cy + dy + ry * Math.sin(a))}`;
  const sector = (Math.PI * 2) / TINTS.length;
  return (
    <>
      <ellipse cx={CX} cy={cy + 12} rx={rx} ry={ry} fill="color-mix(in srgb, var(--imm-ink) 18%, var(--imm-bg))" />
      {TINTS.map((tone, i) => {
        const a0 = i * sector - Math.PI / 2 + 0.03;
        const a1 = (i + 1) * sector - Math.PI / 2 - 0.03;
        return (
          <path
            key={i}
            d={`M${CX},${cy} L${pt(a0)} A${rx},${ry} 0 0 1 ${pt(a1)} Z`}
            fill={tone}
            stroke="var(--imm-ink)"
            strokeOpacity="0.35"
          />
        );
      })}
      <ellipse cx={CX} cy={cy} rx="16" ry="9" fill="var(--imm-bg)" stroke="var(--imm-accent)" />
    </>
  );
}

export default function StoryGlyph({ variant, className = "", title }: { variant: GlyphVariant; className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      {variant === "scatter" &&
        SCATTER.map(([x, y, a], i) => <Slab key={i} x={x} y={y} a={a} t={5} tone={TINTS[i]} />)}
      {variant === "stack" && <Stack gap={44} />}
      {variant === "compact" && (
        <>
          <Stack gap={20} y0={150} />
          <path d={`M${CX},70 V330`} stroke="var(--imm-accent)" strokeDasharray="3 7" strokeOpacity="0.8" />
        </>
      )}
      {variant === "layers" && <Stack gap={58} a={96} y0={80} />}
      {variant === "inspect" && <Stack gap={40} y0={120} inspect={2} />}
      {variant === "calm" && <Stack gap={26} a={92} y0={150} />}
      {variant === "field" && (
        <>
          {NODES.map(([x, y], i) => (
            <line key={`l${i}`} x1={CX} y1={196} x2={x} y2={y} stroke="var(--imm-accent)" strokeOpacity="0.45" strokeDasharray="2 5" />
          ))}
          {[0, 1, 2, 3, 4].reverse().map((i) => (
            <Slab key={`c${i}`} x={CX} y={182 + i * 8} a={34} t={3} tone={TINTS[i]} />
          ))}
          {NODES.map(([x, y], i) => (
            <Slab key={`n${i}`} x={x} y={y} a={30} t={4} tone={TINTS[i]} />
          ))}
        </>
      )}
      {variant === "disc" && <Disc />}
    </svg>
  );
}
