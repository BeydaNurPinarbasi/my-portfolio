"use client";

// Hikâye sahnesi: tek istemci sınırı. Bölümler (children) sunucuda render edilir; burası yalnızca
//  - sticky arka plan sahnesini (lazy Three.js ya da SVG yedeği),
//  - scroll konumunu -> choreography.stateAt() -> sahne durumunu,
//  - bölüme özel DOM hareketlerini (her bölüm FARKLI) ve alan etkileşimini ekler.
//
// Scroll-jacking yok: sahne `position: sticky`, ScrollTrigger yalnızca konumu okur.
// Motion (Framer) bu bileşende kullanılmaz: aynı DOM özelliklerini GSAP ile paylaşmamak için.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { detectTier, type SceneTier } from "@/components/immersive/detect";
import type { StoryScene } from "@/components/immersive/scene/createStoryScene";
import StoryGlyph, { type GlyphVariant } from "./StoryGlyph";
import { activeLayerAt, GLYPH_FOR, holdStateFor, INITIAL_STATE, SECTION_ORDER, SECTION_PILLAR, stateAt } from "./choreography";
import { PILLARS } from "@/content/pillars";

gsap.registerPlugin(ScrollTrigger);

const GLYPHS = Array.from(new Set(Object.values(GLYPH_FOR))) as GlyphVariant[];

// Bölüme özel giriş hareketleri. Her biri bölümün anlamını taşır; hiçbiri tekrar edilmez.
function sectionMotions(root: HTMLElement) {
  const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, root);
  const enter = (trigger: Element) => ({ trigger, start: "top 72%", toggleActions: "play none none reverse" });

  // Perde kartları: tek kelime, ağırlığı scroll ile artar (ağırlık = enerji).
  q(".st-act").forEach((sec) => {
    gsap.fromTo(
      sec.querySelector(".st-act-word"),
      { "--w": 160, letterSpacing: "0.02em" },
      { "--w": 860, letterSpacing: "-0.045em", ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "center 55%", scrub: 0.5 } }
    );
  });

  // 01 Keşif: satırlar alttan maskeyle açılır (adım adım bulunan yol).
  q("#discovery .st-p").forEach((p, i) => {
    gsap.fromTo(p, { clipPath: "inset(0 0 100% 0)", y: 18 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.9, delay: i * 0.18, ease: "power3.out", scrollTrigger: enter(p) });
  });

  // 02 Merakın Peşinde: alanlar soldan sırayla belirir (birbirine bağlanan konular).
  gsap.fromTo(q("#beyond .st-domain"), { x: -28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, stagger: 0.09, ease: "power3.out", scrollTrigger: enter(root.querySelector("#beyond .st-domains")!) });

  // 03 Üretim: başlık kelimeleri sırayla kalınlaşır (fikir -> sistem).
  gsap.fromTo(q("#creation .st-word"), { "--w": 220 }, { "--w": 760, stagger: 0.12, ease: "none", scrollTrigger: { trigger: "#creation", start: "top 70%", end: "center center", scrub: 0.5 } });

  // 05 Sorgulayıcı yaklaşım: her sütunun çizgisi çekilir, sonra soru açılır.
  q("#inquiry .st-inquiry li").forEach((li, i) => {
    const tl = gsap.timeline({ scrollTrigger: enter(li), delay: i * 0.15 });
    tl.fromTo(li.querySelector(".st-rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }).fromTo(
      li.querySelectorAll("h4, p"),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" },
      "-=0.2"
    );
  });

  // 06 Çalışma biçimim: değer kelimeleri ekranın ortasından geçerken kalınlaşır.
  q("#approach .st-value").forEach((v) => {
    gsap.fromTo(v, { "--w": 240, opacity: 0.45 }, { "--w": 780, opacity: 1, ease: "none", scrollTrigger: { trigger: v, start: "top 80%", end: "top 45%", scrub: 0.4 } });
  });

  // 07 Gelecek: metin bulanıktan nete (gelecek netleşiyor).
  gsap.fromTo(q("#vision .st-body, #vision .st-note"), { filter: "blur(10px)", opacity: 0.2 }, { filter: "blur(0px)", opacity: 1, ease: "none", stagger: 0.2, scrollTrigger: { trigger: "#vision", start: "top 65%", end: "center 55%", scrub: 0.5 } });

  // Kapanış: sade yükselme.
  q(".st-plain .st-copy").forEach((c) => gsap.from(c, { y: 28, opacity: 0, duration: 0.8, ease: "power2.out", scrollTrigger: enter(c) }));
}

export default function StoryStage({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<SceneTier | "pending">("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const host = hostRef.current;
    if (!root || !stage || !host) return;

    let disposed = false;
    let scene = null as StoryScene | null;
    let canvas = null as HTMLCanvasElement | null;
    const teardown: Array<() => void> = [];

    const detected = detectTier();
    setTier(detected);
    const isStatic = detected === "static";

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-section]"));
    const caps = Array.from(root.querySelectorAll<HTMLElement>(".st-cap"));
    let tops: number[] = [];
    let pos = 0;
    let sectionIdx = -1;
    let capIdx = -2;

    const measure = () => {
      tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
      tops.push(tops[tops.length - 1] + sections[sections.length - 1].offsetHeight);
    };

    // Konum: ekranın ortasındaki çizginin hangi bölümde, ne kadar ilerlediği.
    const update = () => {
      const y = window.scrollY + window.innerHeight * 0.5;
      let i = 0;
      while (i < sections.length - 1 && y >= tops[i + 1]) i++;
      pos = i + Math.min(1, Math.max(0, (y - tops[i]) / (tops[i + 1] - tops[i])));

      if (i !== sectionIdx) {
        sectionIdx = i;
        const id = SECTION_ORDER[i];
        root.dataset.section = id;
        root.dataset.glyph = GLYPH_FOR[id];
        root.dataset.pillar = SECTION_PILLAR[id] ?? "";
        // Reduced motion: bölüm başına tek kompozisyon, geçişsiz.
        if (isStatic && scene) {
          scene.setState(holdStateFor(i));
          scene.snap();
        }
      }
      if (!isStatic) scene?.setState(stateAt(pos));

      const a = activeLayerAt(pos);
      const ci = a < -1 ? -1 : Math.round(a);
      if (ci !== capIdx && SECTION_ORDER[i] === "layers") {
        capIdx = ci;
        caps.forEach((c, k) => (c.dataset.active = k === ci ? "true" : "false"));
      }
      root.dataset.whole = pos > SECTION_ORDER.indexOf("layers") + 0.86 ? "true" : "false";
    };

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: update,
      onRefresh: () => {
        measure();
        update();
      },
    });
    teardown.push(() => st.kill());

    // ---- Bölüm hareketleri (reduced motion'da yok) ----------------------------------------
    const ctx = gsap.context(() => {
      if (!isStatic) sectionMotions(root);
    }, root);
    teardown.push(() => ctx.revert());

    // ---- Merakın Peşinde: alan seçimi -----------------------------------------------------
    // Üzerine gelme / klavye odağı önizler; tıklama sabitler (aria-pressed). Dokunmatikte tıklama yeterli.
    let pinned: number | null = null;
    const domainButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-domain]"));
    const show = (layer: number | null) => {
      scene?.setFocus(layer);
      if (isStatic) scene?.snap();
      domainButtons.forEach((b) => (b.dataset.focus = String(Number(b.dataset.domain) === layer)));
    };
    const layerOf = (e: Event) => {
      const b = (e.target as Element | null)?.closest<HTMLElement>("[data-domain]");
      return b ? Number(b.dataset.domain) : null;
    };
    const onOver = (e: Event) => {
      const l = layerOf(e);
      if (l !== null) show(l);
    };
    const onOut = (e: Event) => {
      if (layerOf(e) !== null) show(pinned);
    };
    const onClick = (e: Event) => {
      const l = layerOf(e);
      if (l === null) return;
      pinned = pinned === l ? null : l;
      domainButtons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.domain) === pinned)));
      show(pinned);
    };
    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerout", onOut);
    root.addEventListener("focusin", onOver);
    root.addEventListener("focusout", onOut);
    root.addEventListener("click", onClick);
    teardown.push(() => {
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("focusin", onOver);
      root.removeEventListener("focusout", onOut);
      root.removeEventListener("click", onClick);
    });

    if (detected !== "none") {
      import("@/components/immersive/scene/createStoryScene").then(({ createStoryScene }) => {
        if (disposed) return;
        canvas = document.createElement("canvas"); // her çalıştırmada taze canvas (StrictMode)
        canvas.className = "st-canvas";
        host.appendChild(canvas);
        try {
          scene = createStoryScene(canvas, {
            tier: detected as "full" | "lite" | "static",
            initial: INITIAL_STATE,
            onContextLost: () => setReady(false),
          });
        } catch {
          canvas.remove();
          return;
        }
        const s = scene;
        const sizeNow = () => s.resize(stage.clientWidth, stage.clientHeight);
        sizeNow();
        const ro = new ResizeObserver(() => {
          sizeNow();
          ScrollTrigger.refresh();
        });
        ro.observe(stage);
        teardown.push(() => ro.disconnect());

        sectionIdx = -1;
        update();

        if (isStatic) {
          s.setState(holdStateFor(Math.max(0, sectionIdx)));
          s.snap();
          setReady(true);
          return;
        }

        let visible = !document.hidden;
        const onVis = () => {
          visible = !document.hidden;
          s.setActive(visible);
        };
        document.addEventListener("visibilitychange", onVis);
        teardown.push(() => document.removeEventListener("visibilitychange", onVis));

        let first = true;
        const tick = (time: number, deltaMs: number) => {
          if (!visible) return;
          s.tick(time, Math.min(deltaMs / 1000, 0.05));
          if (first) {
            first = false;
            setReady(true);
          }
        };
        gsap.ticker.add(tick);
        teardown.push(() => gsap.ticker.remove(tick));

        const onMove = (e: PointerEvent) => {
          if (e.pointerType === "touch") return;
          s.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
        };
        const onLeave = () => s.setPointer(null, 0);
        const onDown = (e: PointerEvent) => {
          if (e.pointerType === "touch") s.pulse();
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        window.addEventListener("pointerdown", onDown, { passive: true });
        teardown.push(() => {
          window.removeEventListener("pointermove", onMove);
          document.documentElement.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("pointerdown", onDown);
        });
      });
    }

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
    <div ref={rootRef} className="imm-root st-root" data-tier={tier} data-ready={ready} data-section="hero" data-glyph="scatter">
      <div ref={stageRef} className="st-stage" aria-hidden="true">
        <div className="imm-bg" />
        <div className="st-glyphs">
          {GLYPHS.map((g) => (
            <StoryGlyph key={g} variant={g} className={`st-glyph st-glyph--${g}`} />
          ))}
        </div>
        <div ref={hostRef} className="st-canvas-host" />
      </div>

      {/* İlerleme rayı: üç perde. Dekoratif; gezinme başlıklarla yapılır. */}
      <ol className="st-rail" aria-hidden="true">
        {PILLARS.map((p) => (
          <li key={p.id} data-pillar={p.id}>
            <span>{p.numeral}</span> {p.title}
          </li>
        ))}
      </ol>

      <div className="st-flow">{children}</div>
    </div>
  );
}
