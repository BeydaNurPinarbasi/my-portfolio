"use client";

// Özel imleç (docs/interaction-architecture.md §3.4): nokta + ince halka, altı hâl.
//
// Sorumluluk ayrımı: KONUM yalnızca GSAP'de (quickTo, dış elemanlar); GÖRÜNÜM değişimi CSS (data-mode) ve
// etiket geçişi Motion for React'te (iç elemanlar). Aynı özelliği iki kütüphane sürmez.
// Yalnızca ince imleç ve hareket tercihi serbestken StoryStage tarafından gösterilir.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";

export type CursorMode = "normal" | "hover" | "explore" | "open" | "drag" | "close" | "native";

const LABELS: Partial<Record<CursorMode, string>> = {
  explore: "keşfet",
  open: "aç",
  drag: "sürükle",
  close: "kapat",
};

export default function Cursor({ mode }: { mode: CursorMode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = LABELS[mode];

  useEffect(() => {
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;
    // Dış elemanlar: yalnızca konum. Nokta anında, halka gecikmeli (yumuşak izleme).
    const dx = gsap.quickTo(d, "x", { duration: 0.06, ease: "power3.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.06, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.38, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.38, ease: "power3.out" });
    // Yerel imleci gizleyen sınıf BİR KEZ, yüklenirken eklenir. İlk harekette eklemek, geniş CSS seçicileri
    // yüzünden tüm belgenin stilini yeniden hesaplatıp ~100 ms'lik uzun görev üretiyordu (ölçüldü).
    // İlk harekette yalnızca imleç elemanının kendi özniteliği değişir.
    document.documentElement.classList.add("st-cursor-on");
    const show = (on: boolean) => {
      if (wrap.current) wrap.current.dataset.seen = String(on);
    };
    let seen = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (!seen) {
        // İlk harekette konuma atla (ekranın köşesinden süzülmesin).
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        seen = true;
      }
      show(true);
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const leave = () => show(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("st-cursor-on");
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={wrap} className="st-cursor" data-mode={mode} data-seen="false" aria-hidden="true">
        <div ref={ring} className="st-cursor-pos">
          <div className="st-cursor-ring">
            <AnimatePresence mode="wait" initial={false}>
              {label && (
                <m.span
                  key={mode}
                  className="st-cursor-label"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  {mode === "close" ? "×" : label}
                </m.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div ref={dot} className="st-cursor-pos">
          <div className="st-cursor-dot" />
        </div>
      </div>
    </LazyMotion>
  );
}
