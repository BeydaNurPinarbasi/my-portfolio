"use client";

// Hakkımda · neoklasik galeri, sayfa boyunca. Sahne (createClassicScene) sticky bir arka plandır; Hakkımda bölümleri
// sayfanın normal akışında (sunucuda üretilen, `children`) okunur. Kullanıcı kaydırdıkça görünür bölüm değişir ve kamera
// o bölümün istasyonuna GSAP ile koreografik olarak geçer (dolly out + yaklaşma). Scroll ele geçirilmez: sayfa doğal kayar.
// Fare/dokunma: hover ışığı, işaretler, sınırlı sürükleme; bir heykele ya da işarete tıklamak ilgili bölüme kaydırır.
// Erişilebilirlik: metin gerçek HTML'dir (3D'ye bağımlı değil); sahne dekoratif (aria-hidden), işaretler gerçek düğme.
// Reduced motion: kamera anında geçer, kayma yok. WebGL yoksa yalnızca metin akışı kalır.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { detectTier } from "@/components/immersive/detect";
import { STATIONS, type ClassicPart, type ClassicScene } from "@/components/immersive/scene/createClassicScene";
import { ABOUT_SECTIONS } from "@/content/about";
import { PILLARS } from "@/content/pillars";

// İstasyon id'si = bölüm id'si ("overview" hero, "future" aynı zamanda kapanış). Metinler about.ts'ten, değiştirilmeden.
const STEPS = STATIONS.slice(1);
const sectionOf = (id: string) => ABOUT_SECTIONS.find((s) => s.id === id);
const PART_TO_STATION: Record<ClassicPart, number> = { bust: 1, pedestal: 8, column: 5, relief: 3 };
const PILLAR_FIRST = PILLARS.map((p) => STEPS.findIndex((s) => sectionOf(s.id)?.pillar === p.id) + 1);
const stationIndex = (id: string) => Math.max(0, STATIONS.findIndex((s) => s.id === id));

export default function AboutGallery({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ClassicScene | null>(null);
  const idxRef = useRef(0);
  const markEls = useRef<(HTMLButtonElement | null)[]>([]);
  const reduceRef = useRef(false);

  const [idx, setIdx] = useState(0); // 0 = genel galeri (hero)
  const [ready, setReady] = useState(false);
  const [noGl, setNoGl] = useState(false);

  // Bir istasyona ilgili bölümü ortalayarak kaydır (sahneye tıklama, işaret, ray). Kamera kaydırmayı izler.
  const scrollToStation = useCallback((i: number) => {
    const id = STATIONS[i].id;
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-station="${id}"]`);
    el?.scrollIntoView({ behavior: reduceRef.current ? "auto" : "smooth", block: "center" });
  }, []);

  // Kaydırma -> sürekli kamera. Konum (pos), ekranın ortasının bölümler arasındaki yeri: 0 hero, 1..9 bölümler.
  // Kamera her karede kaydırmaya bağlı bir hedefe GSAP ile yaklaşır (scrub): yörünge, dolly ve dağılma kaydırdıkça akar.
  // Kapanış bölümü de "future" istasyonudur. Scroll ele geçirilmez; yalnızca kamera okunur.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const secs = Array.from(root.querySelectorAll<HTMLElement>("[data-station]"));
    let stops: { y: number; idx: number }[] = [];
    const measure = () => {
      const y0 = window.scrollY;
      stops = secs
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { y: y0 + r.top + r.height / 2, idx: stationIndex(el.dataset.station!) };
        })
        .sort((a, b) => a.y - b.y);
    };
    const posNow = () => {
      if (!stops.length) return 0;
      const y = window.scrollY + window.innerHeight * 0.5;
      if (y <= stops[0].y) return stops[0].idx;
      const last = stops[stops.length - 1];
      if (y >= last.y) return last.idx;
      let i = 0;
      while (stops[i + 1].y < y) i++;
      const a = stops[i];
      const b = stops[i + 1];
      return a.idx + ((y - a.y) / (b.y - a.y)) * (b.idx - a.idx);
    };
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const FIELDS = ["az", "el", "dist", "fov", "tx", "ty", "tz", "frame", "yaw", "lift", "cap", "spread", "ring"] as const;
    const poseAt = (pos: number) => {
      const i = Math.min(STATIONS.length - 1, Math.max(0, Math.floor(pos)));
      const j = Math.min(STATIONS.length - 1, i + 1);
      const a = STATIONS[i].pose;
      const b = STATIONS[j].pose;
      // İstasyonda bir süre durur (±%25), ortada akar.
      const f = pos - i;
      const t = smooth(Math.min(1, Math.max(0, (f - 0.25) / 0.5)));
      const out = {} as Record<(typeof FIELDS)[number], number>;
      for (const k of FIELDS) out[k] = a[k] + (b[k] - a[k]) * t;
      // Yakın plandan yakın plana geçerken kamera dışa savrulur (nesnelerin içinden geçmez) ve yörüngede döner.
      if (i !== j && (a.dist < 8 || b.dist < 8)) out.dist += Math.sin(Math.PI * t) * 3.4;
      return out;
    };
    let last = -1;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const scene = sceneRef.current;
      const pos = posNow();
      const near = Math.round(pos);
      if (near !== idxRef.current) {
        idxRef.current = near;
        setIdx(near);
      }
      if (!scene || Math.abs(pos - last) < 0.0004) return;
      last = pos;
      if (reduceRef.current) {
        // Hareket azaltma: ara durum yok, en yakın istasyonun tutulan anı.
        Object.assign(scene.cam, STATIONS[near].pose);
        scene.setDrag(0, 0);
        return;
      }
      const target = poseAt(pos);
      gsap.to(scene.cam, { ...target, duration: 0.85, ease: "power2.out", overwrite: true });
      const d = scene.drag();
      scene.setDrag(d.az * 0.92, d.el * 0.92); // sürükleme sapması kaydırdıkça yumuşakça sönümlenir
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onResize = () => {
      measure();
      last = -1;
      onScroll();
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Sahne sonradan hazır olunca ve yazı tipleri yüklenince ölçümü yenile.
    const iv = window.setInterval(() => {
      if (sceneRef.current) {
        onResize();
        window.clearInterval(iv);
      }
    }, 250);
    document.fonts?.ready.then(onResize);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && idxRef.current !== 0) window.scrollTo({ top: 0, behavior: reduceRef.current ? "auto" : "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.clearInterval(iv);
      cancelAnimationFrame(raf);
      gsap.killTweensOf(sceneRef.current?.cam ?? {});
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;
    let disposed = false;
    const teardown: Array<() => void> = [];
    const tier = detectTier();
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (tier === "none") {
      setNoGl(true);
      return;
    }
    import("@/components/immersive/scene/createClassicScene").then(async ({ createClassicScene }) => {
      if (disposed) return;
      const canvas = document.createElement("canvas");
      canvas.className = "cl-canvas";
      host.appendChild(canvas);
      let scene: ClassicScene;
      try {
        scene = createClassicScene(canvas, { tier: tier as "full" | "lite" | "static", reduce: reduceRef.current, onContextLost: () => setReady(false) });
      } catch {
        canvas.remove();
        setNoGl(true);
        return;
      }
      sceneRef.current = scene;
      const size = () => scene.resize(host.clientWidth, host.clientHeight);
      size();
      const ro = new ResizeObserver(size);
      ro.observe(host);
      let tabVisible = !document.hidden;
      let inView = true;
      const apply = () => scene.setActive(tabVisible && inView);
      const onVis = () => {
        tabVisible = !document.hidden;
        apply();
      };
      document.addEventListener("visibilitychange", onVis);
      const io = new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        apply();
      });
      io.observe(stage);

      // ---- Girdi ----
      const local = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      let drag: { x: number; y: number; az0: number; el0: number; moved: boolean } | null = null;
      const onMove = (e: PointerEvent) => {
        const d = drag;
        if (d) {
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
          if (d.moved) scene.setDrag(d.az0 - dx * 0.0035, d.el0 + dy * 0.0025);
          return;
        }
        if (e.pointerType !== "touch") {
          const p = local(e);
          scene.setPointer(p.x, p.y);
        }
      };
      const onDown = (e: PointerEvent) => {
        const d = scene.drag();
        drag = { x: e.clientX, y: e.clientY, az0: d.az, el0: d.el, moved: false };
        host.setPointerCapture?.(e.pointerId);
        host.classList.add("is-grab");
      };
      const onUp = (e: PointerEvent) => {
        const d = drag;
        drag = null;
        host.classList.remove("is-grab");
        if (!d || d.moved) return;
        const p = local(e);
        const part = scene.pick(p.x, p.y);
        if (part) scrollToStation(PART_TO_STATION[part]);
      };
      const onLeave = () => scene.setPointer(null, 0);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointerup", onUp);

      // ---- Döngü ----
      let first = true;
      let lastT = 0;
      let raf = 0;
      let lastCursor: ClassicPart | null | undefined;
      const frame = (t: number) => {
        raf = requestAnimationFrame(frame);
        const time = t / 1000;
        const dt = Math.min(0.05, lastT ? time - lastT : 0.016);
        lastT = time;
        scene.tick(time, dt);
        const hv = scene.hovered();
        if (hv !== lastCursor) {
          lastCursor = hv;
          host.style.cursor = hv && idxRef.current === 0 ? "pointer" : "";
        }
        const a = scene.anchors();
        const cur = idxRef.current;
        for (let k = 0; k < a.length; k++) {
          const el = markEls.current[k];
          if (!el) continue;
          // Genel görünümde tüm işaretler, odakta yalnızca etkin istasyon (ve komşu işaretler sönük).
          const show = a[k].on && (cur === 0 || cur === k + 1);
          const v = show ? "1" : "0";
          if (el.dataset.on !== v) el.dataset.on = v;
          if (show) el.style.transform = `translate3d(${a[k].x.toFixed(1)}px, ${a[k].y.toFixed(1)}px, 0)`;
        }
        if (first) {
          first = false;
          setReady(true);
        }
      };
      raf = requestAnimationFrame(frame);
      teardown.push(() => {
        cancelAnimationFrame(raf);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
        host.removeEventListener("pointerdown", onDown);
        host.removeEventListener("pointerup", onUp);
        document.removeEventListener("visibilitychange", onVis);
        io.disconnect();
        ro.disconnect();
        scene.dispose();
        sceneRef.current = null;
        canvas.remove();
      });
      try {
        await scene.load();
      } catch {
        setNoGl(true);
      }
    });
    return () => {
      disposed = true;
      teardown.forEach((fn) => fn());
    };
  }, [scrollToStation]);

  const curPillar = idx > 0 ? PILLARS.findIndex((p) => p.id === sectionOf(STATIONS[idx].id)?.pillar) : -1;

  return (
    <div ref={rootRef} className="ag-root" data-focus={idx > 0}>
      <div ref={stageRef} className="ag-stage" data-ready={ready} data-gl={!noGl} aria-hidden={noGl ? true : undefined}>
        <div className="cl-bg" aria-hidden="true" />
        <div ref={hostRef} className="cl-host" aria-hidden="true" />

        {/* İşaretler: gerçek düğme; tıklayınca ilgili bölüme kaydırır. */}
        <div className="cl-marks">
          {STEPS.map((s, k) => (
            <button
              key={s.id}
              ref={(el) => void (markEls.current[k] = el)}
              type="button"
              className="cl-mark"
              data-on="0"
              data-active={idx === k + 1}
              aria-label={sectionOf(s.id)?.title}
              tabIndex={-1}
              onClick={() => scrollToStation(k + 1)}
            >
              <i className="cl-mark-ring" />
              <i className="cl-mark-dot" />
              <span className="cl-mark-box">
                <b>{PILLARS.find((p) => p.id === sectionOf(s.id)?.pillar)?.title}</b>
                <span>{sectionOf(s.id)?.title}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Perde rayı: üç perde arasında atlama. */}
        <nav className="cl-rail" aria-label="Perdeler">
          <ul>
            {PILLARS.map((p, k) => (
              <li key={p.id}>
                <button type="button" aria-pressed={curPillar === k} onClick={() => scrollToStation(PILLAR_FIRST[k])}>
                  <span className="cl-rail-n">{p.numeral}</span>
                  <span className="cl-rail-t">{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <p className="cl-credit">Büst: Rico Cilliers · Poly Haven · CC0</p>
      </div>

      {/* Hakkımda bölümleri: sayfanın akışında, sahnenin üstünde (sunucuda üretilir). */}
      <div className="ag-flow">{children}</div>
    </div>
  );
}
