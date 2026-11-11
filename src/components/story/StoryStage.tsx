"use client";

// Hikâye sahnesi: tek istemci sınırı. Bölümler (children) sunucuda render edilir; burası yalnızca
//  - sticky arka plan sahnesini (lazy Three.js ya da SVG yedeği),
//  - scroll konumunu -> choreography.stateAt() -> sahne durumunu,
//  - bölüme özel DOM hareketlerini (her bölüm FARKLI) ve alan etkileşimini,
//  - 3D noktalara bağlı mimari etiketleri ve kamera okumasını (HUD) ekler.
//
// Scroll-jacking yok: sahne `position: sticky`, ScrollTrigger yalnızca konumu okur.
// Motion (Framer) bu bileşende kullanılmaz: aynı DOM özelliklerini GSAP ile paylaşmamak için.

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { detectTier, type SceneTier } from "@/components/immersive/detect";
import type { StoryScene } from "@/components/immersive/scene/createStoryScene";
import StoryGlyph, { type GlyphVariant } from "./StoryGlyph";
import { activeLayerAt, GLYPH_FOR, holdStateFor, INITIAL_STATE, noteGroupAt, SECTION_ORDER, SECTION_PILLAR, stateAt, type SectionId } from "./choreography";
import { PILLARS } from "@/content/pillars";
import { SCENE_NOTES } from "@/content/annotations";
import { CAPABILITIES } from "@/content/expertise";
import { DOMAINS } from "@/content/domains";
import { TONES } from "@/lib/design/palette";
import { MICRO } from "@/content/microworld";
import { DRAG_CLICK_SLOP, FOCUS_SCROLL_EXIT, focusState, interactionAt, MICRO_INTERACTION, type Focus, type Interaction } from "./interaction";
import type { CursorMode } from "./Cursor";

// Etkileşim katmanı (Motion for React, özel imleç, odak paneli) ilk JS paketine girmez: sahne hazır olunca yüklenir.
const Cursor = dynamic(() => import("./Cursor"), { ssr: false });
const FocusPanel = dynamic(() => import("./FocusPanel"), { ssr: false });

const UI_SELECTOR = "a,button,summary,input,textarea,select,label";
const NATIVE_SELECTOR = ".st-copy,.st-focus,.st-nav,.st-rail,.st-footer";
// Dar düzen: telefon veya dikey ekran. story.css'teki mobil @media sorgusuyla aynı olmalı.
const NARROW_QUERY = "(max-width: 767px), (max-aspect-ratio: 1/1)";
type Region = "ui" | "native" | "bg";
const regionOf = (t: EventTarget | null): Region => {
  const el = t as Element | null;
  if (!el || !el.closest) return "bg";
  if (el.closest(UI_SELECTOR)) return "ui";
  if (el.closest(NATIVE_SELECTOR)) return "native";
  return "bg";
};

gsap.registerPlugin(ScrollTrigger);

const GLYPHS = Array.from(new Set(Object.values(GLYPH_FOR))) as GlyphVariant[];

// HUD'daki bölüm kodu (teknik çizim künyesi gibi). Türkçe büyük harf literal yazıldı.
const SECTION_CODE: Record<SectionId, string> = {
  hero: "00 · GİRİŞ",
  "act-merak": "I · MERAK",
  discovery: "01 · KEŞİF",
  beyond: "02 · ALANLAR",
  "act-uretim": "II · ÜRETİM",
  creation: "03 · ÜRETİM",
  layers: "04 · KATMANLAR",
  inquiry: "05 · GEREKÇE",
  "act-sorumluluk": "III · SORUMLULUK",
  approach: "06 · ÖZEN",
  vision: "07 · GELECEK",
  work: "08 · ÇALIŞMALAR",
  contact: "09 · İLETİŞİM",
};
const deg = (n: number) => String(Math.round(((n % 360) + 360) % 360)).padStart(3, "0");

// Bölüme özel giriş hareketleri. Her biri bölümün anlamını taşır; hiçbiri tekrar edilmez.
function sectionMotions(root: HTMLElement) {
  const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, root);
  const enter = (trigger: Element) => ({ trigger, start: "top 72%", toggleActions: "play none none reverse" });

  // Perde kartları: dev kelime önce zemine yatık (sahnenin parçası), scroll ile ayağa kalkar
  // ve kalınlaşır (ağırlık = enerji). Kamera aynı anda dolly zoom yapar (choreography).
  q(".st-act").forEach((sec) => {
    gsap.fromTo(
      sec.querySelector(".st-act-word"),
      { "--w": 160, letterSpacing: "0.02em", rotateX: 68, transformPerspective: 900, transformOrigin: "50% 100%" },
      { "--w": 860, letterSpacing: "-0.045em", rotateX: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "center 55%", scrub: 0.5 } }
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
  const [cursorMode, setCursorMode] = useState<CursorMode>("normal");
  const [canCursor, setCanCursor] = useState(false);
  const [focusUi, setFocusUi] = useState<Focus | null>(null);
  // İkinci seviye (mikro dünya) ve seçili servis. panelOnly: WebGL yok, panel metin olarak çalışır.
  const [microUi, setMicroUi] = useState(false);
  const [serviceUi, setServiceUi] = useState<number | null>(null);
  const [panelOnly, setPanelOnly] = useState(false);
  const [canEnter, setCanEnter] = useState(false);
  // Odak panelinin düğmeleri effect içindeki işlevlere bu ref üzerinden ulaşır.
  const actions = useRef({
    back: () => {},
    step: (_d: 1 | -1) => {},
    enterMicro: () => {},
    selectService: (_i: number | null) => {},
  });

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
    // WebGL yok: panel 3D olmadan, metin olarak çalışır (aynı içerik, aynı düğmeler).
    if (detected === "none") setPanelOnly(true);

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-section]"));
    const caps = Array.from(root.querySelectorAll<HTMLElement>(".st-cap"));
    let tops: number[] = [];
    let pos = 0;
    let sectionIdx = -1;
    let capIdx = -2;
    const narrow = window.matchMedia(NARROW_QUERY).matches;

    // ---- Etkileşim durumu (docs/interaction-architecture.md) ---------------------------------
    // fine: gerçek imleç (hover + ince). Dokunmatikte hover/parallax/imleç yok; dokun-seç, tekrar dokun-aç.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine && !isStatic) setCanCursor(true);
    let inter: Interaction = interactionAt(0);
    let focus: Focus | null = null;
    // Seviyeler: 0 genel görünüm, 1 katman detayı (focus), 2 mikro dünya (microActive).
    let microActive = false;
    let selectedSvc: number | null = null;
    let microTl: gsap.core.Timeline | null = null;
    const afterMicroClose: Array<() => void> = [];
    let focusY0 = 0;
    let focusTrigger: HTMLElement | null = null;
    let lastKey = false; // son girdi klavye mi? (odak geri dönüşü için)
    const pt = { x: 0, y: 0, has: false, region: "bg" as Region, down: false, sx: 0, sy: 0, dragging: false };
    let touchSel: { layer: number; x: number; y: number } | null = null;
    let touchY0 = 0;
    let curMode: CursorMode = "normal";
    let hvKey = "";

    const hv = stage.querySelector<HTMLElement>(".st-hv");
    const hvIdx = hv?.querySelector<HTMLElement>("b");
    const hvTitle = hv?.querySelector<HTMLElement>(".st-n-title");
    const hvDetail = hv?.querySelector<HTMLElement>(".st-n-detail");
    const hvHint = hv?.querySelector<HTMLElement>(".st-hv-hint");
    const hvBox = hv?.querySelector<HTMLElement>(".st-n-box");
    const hudHint = stage.querySelector<HTMLElement>("[data-hud=hint]");
    const domainButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-domain]"));

    // ---- Mimari etiketler: 3D noktalara bağlı; her karede yalnızca transform değişir -------
    const notes = Array.from(stage.querySelectorAll<HTMLElement>(".st-n")).map((el) => ({
      el,
      anchor: el.dataset.anchor!,
      group: el.dataset.group!,
      layer: el.dataset.layer ? Number(el.dataset.layer) : -1,
      on: false,
      flip: false,
      low: false,
      w: 190, // künye genişliği (açılınca ölçülür): kenar taşmasını önler
    }));
    const hudSec = stage.querySelector<HTMLElement>("[data-hud=sec]");
    const hudCam = stage.querySelector<HTMLElement>("[data-hud=cam]");
    let hudFrame = 0;
    const placeNotes = () => {
      if (!scene) return;
      const A = scene.anchors();
      // Mikro dünya açıkken yalnızca servis etiketleri; ancak servisler yükseldikten sonra.
      const g = microActive ? "micro" : noteGroupAt(pos);
      const microReady = microActive && scene.micro.rise > 0.6;
      const svcActive = scene.microHovered() ?? selectedSvc ?? -1;
      for (const n of notes) {
        const a = A[n.anchor];
        // Dar ekranda yalnızca aktif katmanın etiketi (kalabalık yapmasın).
        // Odak modunda "aktif katman" odaklanılan katmandır (scroll'daki değil).
        const act = focus ? focus.layer : capIdx;
        const want =
          !!a &&
          a.on &&
          n.group === g &&
          (n.group !== "micro" || microReady) &&
          (!narrow || n.group !== "layers" || n.layer === act);
        if (want) {
          n.el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
          // Künye sağdan taşacaksa ve solda yer varsa noktanın soluna döner; ikisi de sığmıyorsa sağda kalır.
          // Üst kenara (gezinme çubuğuna) yakınsa noktanın altına açılır.
          const W = stage.clientWidth;
          const flip = a.x + 38 + n.w > W - 12 && a.x - 38 - n.w > 8;
          const low = a.y < 140;
          if (flip !== n.flip) {
            n.flip = flip;
            n.el.classList.toggle("is-flip", flip);
          }
          if (low !== n.low) {
            n.low = low;
            n.el.classList.toggle("is-low", low);
          }
        }
        if (want !== n.on) {
          n.on = want;
          n.el.classList.toggle("is-on", want);
          if (want) n.w = n.el.querySelector<HTMLElement>(".st-n-box")?.offsetWidth ?? n.w;
        }
        if (n.layer >= 0) {
          // DOM'a yalnızca değer değişince yazılır: her karede aynı öznitelik yazmak, boştayken bile saniyede
          // binlerce stil yeniden hesaplamasına yol açıyordu (ölçüldü).
          const v = String(n.layer === (n.group === "micro" ? svcActive : act));
          if (n.el.dataset.active !== v) n.el.dataset.active = v;
        }
      }
      // Kamera okuması: her karede DOM'a yazmamak için seyrek güncellenir.
      if (hudCam && (hudFrame++ % 6 === 0 || isStatic)) {
        const r = scene.readout();
        const txt = `AZ ${deg(r.az)}° · EL ${deg(r.el)}° · ƒ ${Math.round(r.fov)}°`;
        if (hudCam.textContent !== txt) hudCam.textContent = txt;
      }
    };

    // Sahne hedef durumu: koreografi (scroll) + varsa odak yaması. Static'te tek kare.
    const sync = (snap = false) => {
      if (!scene) return;
      const base = isStatic ? holdStateFor(Math.max(0, sectionIdx)) : stateAt(pos);
      scene.setState(focus ? focusState(focus, base) : base);
      if (snap) {
        scene.snap();
        placeNotes();
      }
    };

    const pushInteraction = () => {
      if (!scene) return;
      scene.setInteraction({
        x: fine && pt.has && pt.region === "bg" ? pt.x : null,
        y: pt.y,
        hover: fine && !isStatic && inter.hover && !pt.dragging,
        parallax: fine && !isStatic,
      });
    };

    const refreshCursor = () => {
      if (!fine || isStatic) return;
      let m: CursorMode;
      if (pt.region === "native") m = "native";
      else if (pt.region === "ui") m = "hover";
      else if (pt.dragging) m = "drag";
      else {
        const over = microActive ? scene?.microHovered() != null : !!scene?.hovered();
        if (microActive) m = over ? "open" : "normal";
        else if (focus) m = over && inter.click === focus.kind ? "open" : "close";
        else m = over ? (inter.click ? "open" : "explore") : "normal";
      }
      if (m !== curMode) {
        curMode = m;
        setCursorMode(m);
      }
    };

    const clearTouch = () => {
      touchSel = null;
      scene?.setInteraction({ x: null, y: 0, hover: false, parallax: false });
    };

    // Etkileşim kuralları seviyeye göre: mikro dünyada servis hover'ı, backend katman detayında modül ipucu.
    const refreshInter = () => {
      inter = microActive ? MICRO_INTERACTION : interactionAt(pos);
      if (!microActive && focus?.kind === "layer" && focus.layer === MICRO.layer) {
        inter = { ...inter, hint: MICRO.enterHint };
      }
      if (hudHint) {
        const txt = fine ? inter.hint : inter.hint.replace("tıkla", "dokun");
        if (hudHint.textContent !== txt) hudHint.textContent = txt;
      }
      setCanEnter(!!scene && !microActive);
    };

    const openFocus = (f: Focus) => {
      if (microActive) return; // mikro dünyadayken katman değiştirilmez; önce geri
      if (!focus) {
        focusY0 = window.scrollY;
        const a = document.activeElement as HTMLElement | null;
        // Klavyeyle açıldıysa, kapanınca odak tetikleyiciye döner.
        focusTrigger = lastKey && a && a !== document.body ? a : null;
      }
      focus = f;
      touchSel = null;
      root.dataset.focus = "true";
      setFocusUi(f);
      domainButtons.forEach((b) => b.setAttribute("aria-pressed", String(f.kind === "domain" && Number(b.dataset.domain) === f.layer)));
      sync(isStatic);
      refreshInter();
      refreshCursor();
    };

    const closeFocus = (restore: boolean) => {
      if (!focus || microActive) return;
      focus = null;
      root.dataset.focus = "false";
      setFocusUi(null);
      setServiceUi(null);
      domainButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      sync(isStatic);
      if (restore && focusTrigger) focusTrigger.focus({ preventScroll: true });
      focusTrigger = null;
      refreshInter();
      refreshCursor();
    };

    // ---- İkinci seviye: mikro dünya --------------------------------------------------------
    // Kamera dahil tüm geçiş TEK bir GSAP zaman çizelgesindedir (scene.micro nesnesini sürer). Scroll yalnızca
    // `cur` durumunu sürer; mikro kamera blend ile karışır. Böylece scroll ve tıklama animasyonları birbirine
    // müdahale etmez: geçiş sürerken girdi kilitlenir (yalnızca geri/Esc zaman çizelgesini tersine çevirir),
    // scroll ile çıkış geçiş bitince değerlendirilir.
    const ensureMicroTl = () => {
      if (microTl || !scene) return microTl;
      const m = scene.micro;
      microTl = gsap
        // Geçiş bitince scroll durumu yeniden değerlendirilir: geçiş sürerken yapılan büyük scroll (çıkış koşulu)
        // ertelenmişti; scroll olayı bir daha gelmese de tutarlı duruma varılır. onComplete içinde zaman çizelgesi
        // hâlâ "etkin" sayıldığından (busy) değerlendirme bir sonraki kareye bırakılır.
        .timeline({ paused: true, defaults: { ease: "power3.inOut" }, onComplete: () => requestAnimationFrame(() => update()) })
        .to(m, { dip: 1, duration: 0.55, ease: "power2.out" }, 0) // makro dalış
        .to(m, { blend: 1, duration: 1.5 }, 0.15) // kamera devri
        .to(m, { shrink: 1, duration: 0.45, ease: "power2.in" }, 0.35) // tıklanan modül kabuğa yerini bırakır
        .to(m, { k: 1, duration: 1.15, ease: "power3.out" }, 0.55) // kabuk modül boyundan dünya boyuna büyür
        .to(m, { open: 1, duration: 0.95 }, 0.6) // duvarlar yatar, kapak kalkar
        .to(m, { dip: 0, duration: 0.9, ease: "power2.inOut" }, 0.8) // kamera geri çekilir
        .to(m, { rise: 1, duration: 0.95, ease: "power2.out" }, 1.2) // servisler yükselir
        .to(m, { flow: 1, duration: 0.8, ease: "power1.out" }, 1.7); // yönlü veri akışı
      return microTl;
    };
    const busy = () => !!microTl && microTl.isActive();

    const selectService = (i: number | null) => {
      selectedSvc = i;
      setServiceUi(i);
      if (!scene) return; // panelOnly: yalnızca metin
      scene.setMicroSelected(i ?? -1);
      const to = i === null ? 0 : 1;
      // Seçime yaslanma ayrı bir nesne ve ayrı bir tween: ana zaman çizelgesine karışmaz.
      if (isStatic) {
        scene.microSel.v = to;
        scene.snap();
        placeNotes();
      } else gsap.to(scene.microSel, { v: to, duration: 0.9, ease: "power3.inOut", overwrite: "auto" });
    };

    const openMicro = (id: number) => {
      if (!scene || microActive || busy()) return;
      if (!(focus?.kind === "layer" && focus.layer === MICRO.layer)) return;
      const tl = ensureMicroTl();
      if (!tl) return;
      microActive = true;
      scene.enterMicro(id);
      setMicroUi(true);
      selectService(null);
      root.dataset.micro = "true";
      if (isStatic) {
        tl.progress(1);
        scene.snap();
        placeNotes();
      } else tl.eventCallback("onReverseComplete", null).timeScale(1).play();
      refreshInter();
      refreshCursor();
    };

    const finishMicroClose = () => {
      scene?.exitMicro();
      microActive = false;
      setMicroUi(false);
      root.dataset.micro = "false";
      refreshInter();
      refreshCursor();
      afterMicroClose.splice(0).forEach((fn) => fn());
    };

    /** Mikro dünyadan katman detayına dön. `then` geri sarma bittikten sonra çalışır (ör. tamamen çıkış). */
    const closeMicro = (then?: () => void) => {
      if (then) afterMicroClose.push(then);
      if (!microActive || !microTl) {
        afterMicroClose.splice(0).forEach((fn) => fn());
        return;
      }
      selectService(null);
      const tl = microTl;
      if (isStatic) {
        tl.progress(0);
        finishMicroClose();
        scene?.snap();
        placeNotes();
        return;
      }
      tl.eventCallback("onReverseComplete", () => {
        tl.eventCallback("onReverseComplete", null);
        finishMicroClose();
      });
      tl.timeScale(1.35).reverse();
    };

    /** Scroll ile (ya da başka yoldan) her seviyeden tamamen çıkış. */
    const closeAll = () => {
      if (microActive) closeMicro(() => closeFocus(false));
      else closeFocus(false);
    };

    // Geri düğmesi: mikro dünyadan katman detayına, katman detayından genel görünüme (iki adım).
    // Esc daha ince adımlıdır: açıklama → mikro dünya → katman detayı → genel görünüm.
    const back = () => {
      if (microActive) closeMicro();
      else closeFocus(true);
    };
    const escape = () => {
      if (microActive && selectedSvc !== null) selectService(null);
      else back();
    };

    actions.current = {
      back,
      step: (d) => {
        if (focus && !microActive) openFocus({ ...focus, layer: (focus.layer + d + CAPABILITIES.length) % CAPABILITIES.length });
      },
      enterMicro: () => {
        if (scene) openMicro(scene.defaultModule(MICRO.layer));
      },
      selectService: (i) => selectService(i),
    };

    // Hover künyesi (editorial, tooltip değil) ve sol metin vurgusu. Konum her karede imleçten.
    const updateHover = () => {
      if (!scene) return;
      if (microActive) {
        // İkinci seviye: etiketler (placeNotes) hover/seçimle genişler; modül künyesi ve sol vurgu kapalı.
        if (hvKey) {
          hvKey = "";
          hv?.classList.remove("is-on");
          caps.forEach((c) => (c.dataset.hover = "false"));
        }
        refreshCursor();
        return;
      }
      const h = touchSel ?? scene.hovered();
      const field = noteGroupAt(pos) === "domains";
      const key = h && !focus ? `${h.layer}:${field}:${inter.click}` : "";
      if (key !== hvKey) {
        hvKey = key;
        const layer = h && !focus ? h.layer : -1;
        if (hv && layer >= 0) {
          const cap = CAPABILITIES[layer];
          const dom = DOMAINS.find((d) => d.layer === layer);
          if (hvIdx) hvIdx.textContent = field ? "ALAN" : cap.index;
          if (hvTitle) hvTitle.textContent = field && dom ? dom.label : cap.label;
          if (hvDetail) hvDetail.textContent = field ? "bilgi alanı" : cap.behavior;
          if (hvHint) hvHint.textContent = inter.click ? (fine ? "tıkla · yaklaş" : "tekrar dokun · aç") : "";
          hv.style.setProperty("--cat", TONES[cap.tone]);
        }
        hv?.classList.toggle("is-on", layer >= 0);
        // Sol metin vurgusu: yetkinlik listesi ya da alan düğmeleri.
        caps.forEach((c, k) => (c.dataset.hover = String(k === layer && !field)));
        domainButtons.forEach((b) => (b.dataset.hover = String(field && Number(b.dataset.domain) === layer)));
      }
      if (key && hv) {
        const x = touchSel ? touchSel.x : pt.x;
        const y = touchSel ? touchSel.y : pt.y;
        hv.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        const hw = hvBox?.offsetWidth ?? 200;
        hv.classList.toggle("is-flip", x + 38 + hw > stage.clientWidth - 12 && x - 38 - hw > 8);
        // Üst kenara yakınsa künye noktanın altına açılır (gezinme çubuğuyla çakışmasın).
        hv.classList.toggle("is-low", y < 140);
      }
      refreshCursor();
    };

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
        if (hudSec) hudSec.textContent = SECTION_CODE[id];
        // Reduced motion: bölüm başına tek kompozisyon, geçişsiz.
        if (isStatic && scene) sync(true);
      }
      // Odak modundan sıkışmadan çıkış: yarım ekran scroll. Mikro geçiş sürerken beklenir (animasyonlar karışmasın).
      if (focus && !busy() && Math.abs(window.scrollY - focusY0) > window.innerHeight * FOCUS_SCROLL_EXIT) closeAll();
      if (touchSel && Math.abs(window.scrollY - touchY0) > 80) clearTouch();
      refreshInter();
      if (!isStatic) sync();
      pushInteraction();

      const a = activeLayerAt(pos);
      const ci = a < -1 ? -1 : Math.round(a);
      if (ci !== capIdx && SECTION_ORDER[i] === "layers") {
        capIdx = ci;
        caps.forEach((c, k) => (c.dataset.active = k === ci ? "true" : "false"));
      }
      root.dataset.whole = pos > SECTION_ORDER.indexOf("layers") + 0.86 ? "true" : "false";
      if (isStatic) placeNotes();
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

    // ---- Listeler: hover önizler, tıklama odak modunu açar ---------------------------------
    // Sol listedeki alan/yetkinlik düğmeleri 3D hover ile çift yönlüdür (aria-pressed odak durumunu yansıtır).
    // Klavye: odaklanınca önizler, Enter/Space odak modunu açar, Esc kapatır.
    const show = (layer: number | null) => {
      scene?.setFocus(layer);
      if (isStatic) {
        scene?.snap();
        placeNotes();
      }
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
      if (layerOf(e) !== null) show(null);
    };
    const onClick = (e: Event) => {
      const t = e.target as Element | null;
      const d = t?.closest<HTMLElement>("[data-domain]");
      if (d) {
        const l = Number(d.dataset.domain);
        if (focus?.kind === "domain" && focus.layer === l) closeFocus(true);
        else openFocus({ kind: "domain", layer: l });
        return;
      }
      const f = t?.closest<HTMLElement>("[data-focus-layer]");
      if (f) openFocus({ kind: "layer", layer: Number(f.dataset.focusLayer) });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focus) {
        e.preventDefault();
        escape();
        return;
      }
      lastKey = true;
    };
    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerout", onOut);
    root.addEventListener("focusin", onOver);
    root.addEventListener("focusout", onOut);
    root.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    teardown.push(() => {
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("focusin", onOver);
      root.removeEventListener("focusout", onOut);
      root.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
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
          setPanelOnly(true);
          return;
        }
        const s = scene;
        // Hero künyesindeki modül sayısı: sahnedeki gerçek değer.
        stage.querySelectorAll<HTMLElement>("[data-modules]").forEach((el) => {
          el.textContent = el.dataset.modules!.replace("{modules}", String(s.moduleCount));
        });
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
        refreshInter();

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
          placeNotes();
          updateHover();
          if (first) {
            first = false;
            setReady(true);
          }
        };
        gsap.ticker.add(tick);
        teardown.push(() => gsap.ticker.remove(tick));

        // Ölçüm kancası: YALNIZCA ?perf ile açılır. Kare süreleri (rAF), sahne CPU süresi, GPU seçimi gecikmesi,
        // çizim çağrıları ve GPU adı; otomatik test için window.__story üzerinden sürülebilir.
        if (new URLSearchParams(window.location.search).has("perf")) {
          const frames: number[] = [];
          const onFrame = (_t: number, deltaMs: number) => {
            frames.push(deltaMs);
            if (frames.length > 600) frames.shift();
          };
          gsap.ticker.add(onFrame);
          const box = document.createElement("div");
          box.className = "st-perf";
          document.body.appendChild(box);
          const read = () => {
            const avg = frames.reduce((a, b) => a + b, 0) / (frames.length || 1);
            const sorted = frames.slice().sort((a, b) => a - b);
            const st = s.stats();
            return {
              fps: 1000 / avg,
              avgMs: avg,
              p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
              maxMs: sorted[sorted.length - 1] ?? 0,
              frames: frames.length,
              ...st,
              gpu: s.gpu(),
              level: microActive ? 2 : focus ? 1 : 0,
            };
          };
          const iv = window.setInterval(() => {
            const r = read();
            box.textContent = `${r.fps.toFixed(0)} fps · kare ${r.avgMs.toFixed(1)} ms (p95 ${r.p95Ms.toFixed(1)}) · sahne ${r.tickMs.toFixed(2)} ms · seçim ${r.pickSubmitMs.toFixed(2)}/${r.pickRttMs.toFixed(1)} ms · ${r.calls} çizim · ${(r.triangles / 1000).toFixed(1)}k üçgen · L${r.level}`;
          }, 500);
          (window as unknown as { __story: unknown }).__story = {
            read,
            reset: () => (frames.length = 0),
            focusLayer: (l: number) => openFocus({ kind: "layer", layer: l }),
            enterMicro: () => actions.current.enterMicro(),
            select: (i: number | null) => actions.current.selectService(i),
            back: () => actions.current.back(),
            closeAll,
            busy,
          };
          teardown.push(() => {
            gsap.ticker.remove(onFrame);
            window.clearInterval(iv);
            box.remove();
            delete (window as unknown as { __story?: unknown }).__story;
          });
        }

        // Sahne içi etkileşim. Yalnızca arka plana yönelik girdi dikkate alınır (metin, düğme, panel hariç).
        const rectOf = () => stage.getBoundingClientRect();
        const endDrag = () => {
          if (pt.dragging) {
            pt.dragging = false;
            root.classList.remove("is-dragging");
            s.setTilt(0, 0); // yaylanarak döner (~1 sn)
          }
          pt.down = false;
          pushInteraction();
          refreshCursor();
        };

        const onMove = (e: PointerEvent) => {
          const touch = e.pointerType === "touch";
          if (!touch) {
            const r = rectOf();
            pt.region = regionOf(e.target);
            pt.x = e.clientX - r.left;
            pt.y = e.clientY - r.top;
            pt.has = true;
            // Genel sahne tepkisi: kamera ve derinlik parallax'ı.
            pushInteraction();
            s.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
          }
          // Kontrollü sürükleme: 6 pikselden kısa = tıklama; tam orbit yok (sahne içinde ±21° / ±7° sınırı).
          if (pt.down) {
            const dx = e.clientX - pt.sx;
            const dy = e.clientY - pt.sy;
            if (!pt.dragging && Math.hypot(dx, dy) > DRAG_CLICK_SLOP && (inter.drag || focus)) {
              // Dokunmatikte yalnızca yatay hareket sürükleme sayılır: dikey scroll asla bozulmaz.
              if (!touch || Math.abs(dx) > Math.abs(dy) * 1.5) {
                pt.dragging = true;
                root.classList.add("is-dragging");
                pushInteraction();
              }
            }
            if (pt.dragging) s.setTilt((dx / window.innerWidth) * 1.1, (-dy / window.innerHeight) * 0.5);
          }
          refreshCursor();
        };

        const onLeave = () => {
          pt.has = false;
          s.setPointer(null, 0);
          pushInteraction();
        };

        const onDown = (e: PointerEvent) => {
          lastKey = false;
          if (e.pointerType === "touch") s.pulse();
          const region = regionOf(e.target);
          if (region !== "bg" || e.button > 0) return;
          const r = rectOf();
          pt.down = true;
          pt.sx = e.clientX;
          pt.sy = e.clientY;
          pt.x = e.clientX - r.left;
          pt.y = e.clientY - r.top;
        };

        // Tıklama / dokunma: hareketsiz bırakılan basış. GPU seçimi ekranda gerçekten görünen yapıyı bulur.
        const sceneTap = async (e: PointerEvent) => {
          const r = rectOf();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          const touch = e.pointerType === "touch";
          // İkinci seviye (mikro dünya): servis seçimi. Geçiş sürerken girdi kilitli (animasyonlar karışmasın).
          if (microActive) {
            if (busy()) return;
            const svc = (!touch ? s.microHovered() : null) ?? (await s.pickMicroAt(x, y));
            if (svc !== null) selectService(svc === selectedSvc ? null : svc);
            else if (selectedSvc !== null) selectService(null);
            return;
          }
          // Fare: kullanıcının gördüğü (vurgulu) yapı esas alınır; kenarlarda tıklama ile hover ayrışmasın.
          // Dokunmatik: hover yok, dokunulan noktada anlık seçim.
          const hit = (!touch ? s.hovered() : null) ?? (await s.pickAt(x, y));
          // Backend katman detayında bir modüle tıklama: modülün içine gir (mikro dünya).
          if (focus?.kind === "layer" && focus.layer === MICRO.layer && hit && !hit.plate && hit.layer === MICRO.layer) {
            if (!busy()) openMicro(hit.id);
            return;
          }
          if (focus) {
            // Odak modunda: aynı türden başka yapı = odak değiştir; arka plan = bütüne dön.
            if (hit && inter.click === focus.kind) {
              if (hit.layer !== focus.layer) openFocus({ kind: focus.kind, layer: hit.layer });
            } else closeFocus(false);
            return;
          }
          if (!hit) {
            if (touchSel) clearTouch();
            return;
          }
          if (inter.click) {
            // Dokunmatik: ilk dokunuş seçer (künye çıkar), aynı yere ikinci dokunuş açar.
            if (touch && touchSel?.layer !== hit.layer) {
              touchSel = { layer: hit.layer, x, y };
              touchY0 = window.scrollY;
              return;
            }
            touchSel = null;
            openFocus({ kind: inter.click, layer: hit.layer });
          } else if (touch) {
            touchSel = { layer: hit.layer, x, y };
            touchY0 = window.scrollY;
          }
        };

        const onUp = (e: PointerEvent) => {
          if (!pt.down) return;
          const wasDrag = pt.dragging;
          const moved = Math.hypot(e.clientX - pt.sx, e.clientY - pt.sy);
          endDrag();
          if (!wasDrag && moved <= DRAG_CLICK_SLOP) void sceneTap(e);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        window.addEventListener("pointerdown", onDown, { passive: true });
        window.addEventListener("pointerup", onUp, { passive: true });
        window.addEventListener("pointercancel", endDrag, { passive: true });
        teardown.push(() => {
          window.removeEventListener("pointermove", onMove);
          document.documentElement.removeEventListener("pointerleave", onLeave);
          window.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", endDrag);
          root.classList.remove("is-dragging");
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
    <div ref={rootRef} className="imm-root st-root" data-tier={tier} data-ready={ready} data-section="hero" data-glyph="scatter" data-focus="false">
      <div ref={stageRef} className="st-stage" aria-hidden="true">
        <div className="imm-bg" />
        <div className="st-glyphs">
          {GLYPHS.map((g) => (
            <StoryGlyph key={g} variant={g} className={`st-glyph st-glyph--${g}`} />
          ))}
        </div>
        <div ref={hostRef} className="st-canvas-host" />

        {/* Mimari etiketler: konumları her karede 3D'den izdüşürülür. Dekoratif kopya (aria-hidden üst öğede). */}
        <div className="st-notes">
          {SCENE_NOTES.map((n) => (
            <div key={n.id} className={`st-n st-n--${n.group}`} data-anchor={n.anchor} data-group={n.group} data-layer={n.layer}>
              <i className="st-n-dot" />
              <i className="st-n-lead" />
              <span className="st-n-box">
                {n.index && <b>{n.index}</b>}
                <span className="st-n-title">{n.title}</span>
                {n.detail && (
                  <span className="st-n-detail" data-modules={n.detail.includes("{modules}") ? n.detail : undefined}>
                    {n.detail.replace("{modules}", "…")}
                  </span>
                )}
              </span>
            </div>
          ))}
          {/* Hover künyesi: imlece bağlı, editorial (tooltip değil). İçerik ve konum JS'ten. */}
          <div className="st-n st-hv">
            <i className="st-n-dot" />
            <i className="st-n-lead" />
            <span className="st-n-box">
              <b />
              <span className="st-n-title" />
              <span className="st-n-detail" />
              <em className="st-hv-hint" />
            </span>
          </div>
        </div>

        {/* Teknik okuma: bölüm kodu ve canlı kamera değerleri (yaşayan sistem mikro detayı). */}
        <div className="st-hud">
          <span data-hud="sec">{SECTION_CODE.hero}</span>
          <span data-hud="cam" />
          <span data-hud="hint" />
        </div>
      </div>

      {/* İlerleme rayı: üç perde. Dekoratif; gezinme başlıklarla yapılır. */}
      <ol className="st-rail" aria-hidden="true">
        {PILLARS.map((p) => (
          <li key={p.id} data-pillar={p.id}>
            <span>{p.numeral}</span> <em className="st-rail-t">{p.title}</em>
          </li>
        ))}
      </ol>

      {/* Etkileşim katmanı: sahne hazır olunca yüklenir (ilk JS paketine girmez). */}
      {ready && canCursor && <Cursor mode={cursorMode} />}
      {(ready || panelOnly) && (
        <FocusPanel
          focus={focusUi}
          micro={microUi}
          service={serviceUi}
          textOnly={panelOnly}
          canEnterMicro={canEnter && !panelOnly}
          onBack={() => actions.current.back()}
          onStep={(d) => actions.current.step(d)}
          onEnterMicro={() => actions.current.enterMicro()}
          onSelectService={(i) => actions.current.selectService(i)}
        />
      )}

      <div className="st-flow">{children}</div>
    </div>
  );
}
