"use client";

// Strata hero: DOM + GSAP/ScrollTrigger orkestrasyonu. WebGL sahnesi ayrı modülde
// (scene/createHeroScene) ve LAZY yüklenir: three, ilk JS paketine girmez.
//
// Sorumluluk ayrımı:
//   CSS      -> giriş koreografisi (başlık harfleri, JS beklemeden), durum geçişleri
//   GSAP     -> scroll'a bağlı tipografi, katman açıklamaları, sahne uniform'ları
//   Three    -> yalnızca canvas içi (scene/*)
//   Motion   -> bu bileşende KULLANILMAZ: aynı DOM özelliklerini GSAP ile paylaşmamak için.
//
// Scroll-jacking yok: sahne `position: sticky` bir kapsayıcıdadır; ScrollTrigger sadece
// ilerleme (0..1) okur, kaydırmayı yakalamaz.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroFallback from "./HeroFallback";
import { CAPABILITIES } from "@/content/expertise";
import { TONES } from "@/lib/design/palette";
import { detectTier, type SceneTier } from "./detect";
import type { HeroScene } from "./scene/createHeroScene";

gsap.registerPlugin(ScrollTrigger);

// Katman aralığı: 3D tarafıyla (createHeroScene.applyFrame) aynı sabitler.
const LAYERS_START = 0.28;
const LAYERS_SPAN = 0.64;

const TITLE_LINES = [
  { text: "Yazılım", outline: false },
  { text: "Geliştirici", outline: true },
] as const;

function SplitChars({ text, className = "" }: { text: string; className?: string }) {
  // Gerçek metin ekran okuyucuya tek parça verilir; harfler dekoratif.
  return (
    <>
      <span className="imm-sr">{text}</span>
      <span aria-hidden="true" className={className}>
        {Array.from(text).map((ch, i) => (
          <span key={i} className="imm-c" style={{ ["--i" as string]: i }}>
            {ch}
          </span>
        ))}
      </span>
    </>
  );
}

// Her katmanın açıklaması FARKLI bir biçimde açılır (bkz. docs §5, §7).
const REVEALS: ((el: Element) => gsap.core.Tween)[] = [
  (el) => gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power3.out" }),
  (el) => gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)", yPercent: 45 }, { clipPath: "inset(0% 0 0 0)", yPercent: 0, duration: 0.8, ease: "power3.out" }),
  (el) => gsap.fromTo(el.querySelectorAll(".imm-c"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.018 }),
  (el) => gsap.fromTo(el, { filter: "blur(14px)", opacity: 0, scale: 1.05 }, { filter: "blur(0px)", opacity: 1, scale: 1, duration: 0.9, ease: "power2.out" }),
  (el) => gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "steps(9)" }),
];

export default function ImmersiveHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<SceneTier | "pending">("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    const host = hostRef.current;
    if (!root || !track || !stage || !host) return;

    let disposed = false;
    // `as` cast: atamalar async callback içinde; TS aksi halde bunları `null`a daraltır.
    let scene = null as HeroScene | null;
    let canvas = null as HTMLCanvasElement | null;
    let trigger: ScrollTrigger | undefined;
    const teardown: Array<() => void> = [];

    const detected = detectTier();
    setTier(detected);
    if (detected === "none") return; // SVG fallback kalır

    const isStatic = detected === "static";
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    // ---- GSAP: kapsamlı bağlam, unmount'ta tamamı geri alınır --------------------------------
    const ctx = gsap.context(() => {
      if (isStatic) return; // reduced motion: scrub/animasyon yok, içerik normal akışta

      const items = gsap.utils.toArray<HTMLElement>(".imm-cap", root);
      const rail = root.querySelector<HTMLElement>(".imm-rail-fill");
      let activeIdx = -1;

      // Başlık: scroll ile incelir (kinetik ağırlık), 2. satır konturdan dolguya, sonra çıkar.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.15}`,
            scrub: 0.6,
          },
        })
        .to(".imm-title", { "--w": 260, ease: "none", duration: 1 }, 0)
        .to(".imm-line--2", { "--fill": 1, ease: "none", duration: 0.5 }, 0)
        .to(".imm-title", { yPercent: -28, opacity: 0, ease: "power1.in", duration: 0.55 }, 0.45)
        .to(".imm-cue", { opacity: 0, duration: 0.2 }, 0);

      const setActive = (idx: number) => {
        if (idx === activeIdx) return;
        activeIdx = idx;
        items.forEach((li, i) => {
          const on = i === idx;
          li.dataset.active = on ? "true" : "false";
          const name = li.querySelector(".imm-cap-name");
          const desc = li.querySelector(".imm-cap-desc");
          if (name) gsap.to(name, { "--w": on ? 720 : 340, duration: 0.7, ease: "power3.out", overwrite: "auto" });
          if (desc) {
            gsap.killTweensOf(desc);
            if (on) {
              // Reveal bitince clip-path/filter/transform kaldırılır: clip-path kutusu metni kırpmaya devam etmesin.
              ctx.add(() => {
                REVEALS[i](desc).eventCallback("onComplete", () => {
                  gsap.set(desc, { clearProps: "clipPath,filter,transform" });
                  gsap.set(desc.querySelectorAll(".imm-c"), { clearProps: "all" });
                });
              });
            }
            else gsap.set(desc, { clearProps: "all", opacity: 0 });
          }
        });
      };

      const apply = (self: ScrollTrigger) => {
        const p = self.progress;
        scene?.setProgress(p);
        if (rail) gsap.set(rail, { scaleY: p });
        const phase = p < 0.2 ? "title" : p < 0.94 ? "layers" : "out";
        if (stage.dataset.phase !== phase) stage.dataset.phase = phase;
        const idx =
          p > LAYERS_START - 0.01 && p < 0.94
            ? Math.min(CAPABILITIES.length - 1, Math.max(0, Math.floor(((p - LAYERS_START) / LAYERS_SPAN) * CAPABILITIES.length)))
            : -1;
        setActive(idx);
      };

      // onRefresh: sayfa scroll edilmiş konumda yüklendiğinde / yeniden boyutlandığında da doğru durum.
      trigger = ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        onUpdate: apply,
        onRefresh: apply,
      });
    }, root);
    teardown.push(() => ctx.revert());

    // ---- WebGL: lazy yükleme --------------------------------------------------------------
    import("./scene/createHeroScene").then(({ createHeroScene }) => {
      if (disposed) return;

      // Her çalıştırmada TAZE canvas: React StrictMode (dev) efekti iki kez çalıştırır ve
      // forceContextLoss edilmiş bir canvas'ta yeni bağlam alınamaz.
      canvas = document.createElement("canvas");
      canvas.className = "imm-canvas";
      host.appendChild(canvas);

      try {
        scene = createHeroScene(canvas, {
          tier: detected as "full" | "lite" | "static",
          onContextLost: () => setReady(false), // fallback'e dön
        });
      } catch {
        canvas.remove();
        return; // fallback kalır
      }

      const s = scene;
      if (trigger) s.setProgress(trigger.progress);
      const sizeNow = () => s.resize(stage.clientWidth, stage.clientHeight);
      sizeNow();
      const ro = new ResizeObserver(() => {
        sizeNow();
        ScrollTrigger.refresh();
      });
      ro.observe(stage);
      teardown.push(() => ro.disconnect());

      s.intro();

      if (isStatic) {
        setReady(true);
      } else {
        let inView = true;
        const update = () => s.setActive(inView && !document.hidden);

        const io = new IntersectionObserver(([e]) => {
          inView = e.isIntersecting;
          update();
        });
        io.observe(stage);
        document.addEventListener("visibilitychange", update);
        teardown.push(() => {
          io.disconnect();
          document.removeEventListener("visibilitychange", update);
        });

        // Tek zamanlayıcı: ScrollTrigger ile aynı kare. Büyük delta (sekme dönüşü) kırpılır.
        let first = true;
        const tick = (time: number, deltaMs: number) => {
          s.tick(time, Math.min(deltaMs / 1000, 0.05));
          if (first) {
            first = false;
            setReady(true);
          }
        };
        gsap.ticker.add(tick);
        teardown.push(() => gsap.ticker.remove(tick));

        // Fare: yalnızca ince imleç. Dokunmatikte dokunuş "ışık darbesi" üretir.
        const onMove = (e: PointerEvent) => {
          if (e.pointerType === "touch") return;
          const r = stage.getBoundingClientRect();
          s.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
        };
        const onLeave = () => s.setPointer(null, 0);
        const onDown = () => s.pulse();
        stage.addEventListener("pointermove", onMove);
        stage.addEventListener("pointerleave", onLeave);
        stage.addEventListener("pointerdown", onDown);
        teardown.push(() => {
          stage.removeEventListener("pointermove", onMove);
          stage.removeEventListener("pointerleave", onLeave);
          stage.removeEventListener("pointerdown", onDown);
        });
      }
    });

    // Font yüklendiğinde başlık ölçüleri değişir -> tetikleyici konumları yenilenmeli.
    document.fonts?.ready.then(() => !disposed && ScrollTrigger.refresh());

    return () => {
      disposed = true;
      teardown.reverse().forEach((fn) => fn());
      scene?.dispose();
      scene = null;
      canvas?.remove();
    };
  }, []);

  return (
    <div ref={rootRef} className="imm-root" data-tier={tier} data-ready={ready}>
      <a className="imm-skip" href="#imm-after">
        İçeriğe geç
      </a>

      <div ref={trackRef} className="imm-track">
        <div ref={stageRef} className="imm-stage" data-phase="title">
          <div className="imm-bg" aria-hidden="true" />

          <div className="imm-visual" aria-hidden="true">
            <HeroFallback className="imm-fallback" />
            <div ref={hostRef} className="imm-canvas-host" />
          </div>

          <header className="imm-top">
            <span>BEYDA NUR PINARBAŞI</span>
            <span className="imm-top-mid">STRATA · PROTOTİP 01</span>
            <Link href="/" className="imm-top-link">
              ← Ana site
            </Link>
          </header>

          <div className="imm-title">
            <h1 className="imm-h1">
              <span className="imm-sr">Yazılım Geliştirici</span>
              {TITLE_LINES.map((line, n) => (
                <span key={line.text} className={`imm-line imm-line--${n + 1}${line.outline ? " is-outline" : ""}`} aria-hidden="true">
                  {Array.from(line.text).map((ch, i) => (
                    <span key={i} className="imm-c" style={{ ["--i" as string]: i + n * 7 }}>
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="imm-sub">Mobil, web ve backend uygulamaları geliştiriyorum.</p>
          </div>

          <section className="imm-caps" aria-label="Yetkinlikler">
            <ol className="imm-caps-list">
              {CAPABILITIES.map((cap) => (
                <li key={cap.id} className="imm-cap" data-active="false" style={{ ["--cat" as string]: TONES[cap.tone] }}>
                  <span className="imm-cap-idx">{cap.index}</span>
                  <div>
                    <h2 className="imm-cap-name">
                      <span className="imm-sr">{cap.labelEn}</span>
                      <span aria-hidden="true">{cap.label}</span>
                    </h2>
                    <p className="imm-cap-desc">
                      <SplitChars text={cap.description} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="imm-rail" aria-hidden="true">
            <div className="imm-rail-fill" />
          </div>
          <div className="imm-cue" aria-hidden="true">
            <span>KAYDIR</span>
            <i />
          </div>
        </div>
      </div>

      <section id="imm-after" className="imm-after">
        <p className="imm-after-label">SAHNE 03 · SEÇİLMİŞ ÇALIŞMALAR</p>
        <p className="imm-after-text">
          Prototip burada biter. Bu alan, onaylanan görsel dil Phase 3&apos;te tüm siteye uygulandığında editoryal proje vitrinine dönüşecek.
        </p>
      </section>
    </div>
  );
}
