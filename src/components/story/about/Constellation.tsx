"use client";

// Hakkımda · Merakın Peşinde: bilgi alanlarının ilişkisini gösteren hafif etkileşimli harita.
// Uzun okuma sayfası olduğu için WebGL yok; aynı görsel dil (katman tonları, merkezde yazılım çekirdeği)
// SVG + GSAP ile. Erişilebilirlik: SVG dekoratif; seçim gerçek düğmelerle, açıklama aria-live ile okunur.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DOMAINS, DOMAIN_LINKS } from "@/content/domains";
import { CAPABILITIES } from "@/content/expertise";
import { TONES } from "@/lib/design/palette";

const tone = (layer: number) => TONES[CAPABILITIES[layer].tone];
const HUB = [210, 170] as const;
const NODES = DOMAINS.map((_, i) => {
  const a = (i / DOMAINS.length) * Math.PI * 2 - Math.PI / 2;
  // Yuvarlama: sunucu/tarayıcı trigonometri farkı hydration uyuşmazlığı üretmesin.
  return [Math.round(HUB[0] + Math.cos(a) * 150), Math.round(HUB[1] + Math.sin(a) * 118)] as const;
});

export default function Constellation() {
  const ref = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const shown = focus ?? pinned;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Görünür olunca bağlar merkezden dışa çizilir; sonra düğümler çok hafif nefes alır.
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<SVGLineElement>(".ab-link");
      lines.forEach((l) => {
        const len = Math.hypot(+l.getAttribute("x2")! - +l.getAttribute("x1")!, +l.getAttribute("y2")! - +l.getAttribute("y1")!);
        gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
      });
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        gsap.to(lines, { strokeDashoffset: 0, duration: 1.1, stagger: 0.06, ease: "power2.out" });
        gsap.from(".ab-node", { scale: 0.6, opacity: 0, transformOrigin: "center", duration: 0.7, stagger: 0.08, ease: "back.out(1.6)" });
      });
      io.observe(el);
      return () => io.disconnect();
    }, el);
    return () => ctx.revert();
  }, []);

  const lit = (a: number, b: number) => shown !== null && (a === shown || b === shown);

  return (
    <div ref={ref} className="ab-constellation">
      <svg viewBox="0 0 420 340" aria-hidden="true" focusable="false">
        {NODES.map(([x, y], i) => (
          <line key={`h${i}`} className="ab-link" data-lit={lit(-1, i)} x1={HUB[0]} y1={HUB[1]} x2={x} y2={y} />
        ))}
        {DOMAIN_LINKS.map(([a, b]) => (
          <line key={`${a}-${b}`} className="ab-link ab-link--peer" data-lit={lit(a, b)} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
        ))}
        {/* Merkez: yazılım (küçük katman yığını) */}
        {[4, 3, 2, 1, 0].map((i) => (
          <polygon
            key={`c${i}`}
            points={`${HUB[0]},${HUB[1] - 14 + i * 6} ${HUB[0] + 26},${HUB[1] + i * 6} ${HUB[0]},${HUB[1] + 14 + i * 6} ${HUB[0] - 26},${HUB[1] + i * 6}`}
            fill={tone(i)}
            stroke="var(--imm-ink)"
            strokeOpacity="0.35"
            transform="translate(0,-12)"
          />
        ))}
        {NODES.map(([x, y], i) => (
          <g key={`n${i}`} className="ab-node" data-lit={shown === i}>
            <circle cx={x} cy={y} r={shown === i ? 20 : 15} fill={tone(DOMAINS[i].layer)} stroke="var(--imm-ink)" strokeOpacity="0.35" />
          </g>
        ))}
      </svg>

      <ul className="ab-domains" aria-label="Yazılım dışındaki ilgi alanları">
        {DOMAINS.map((d, i) => (
          <li key={d.id} style={{ ["--cat" as string]: tone(d.layer) }}>
            <button
              type="button"
              className="st-domain"
              aria-pressed={pinned === i}
              data-focus={shown === i}
              onPointerEnter={() => setFocus(i)}
              onPointerLeave={() => setFocus(null)}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus(null)}
              onClick={() => setPinned((p) => (p === i ? null : i))}
            >
              <span className="st-dot" aria-hidden="true" />
              <span className="st-domain-label">{d.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="ab-caption" aria-live="polite">
        {shown === null ? "Bir alan seçin: merkezde yazılım, çevresinde onu besleyen sorular." : DOMAINS[shown].question}
      </p>
    </div>
  );
}
