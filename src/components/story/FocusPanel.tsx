"use client";

// Odak modu içerik paneli (docs/interaction-architecture.md §3.3, docs/micro-worlds.md). Motion for React ile geçişler.
// İçerik yalnızca doğrulanmış içerik modelinden (expertise.ts, domains.ts, microworld.ts): yeni iddia eklemez.
// Erişilebilirlik: başlığa odak taşınır, Esc ile kapanır, her şey gerçek düğme (3D'ye bağımlı değil).
//
// İki seviye:
//   1. Katman detayı: yetkinlik açıklaması. Backend'de "Bir modülün içine gir" (mikro dünya).
//   2. Mikro dünya: servis listesi (3D'deki yapıların düğme karşılığı) + seçilen servisin kısa açıklaması.
// WebGL yoksa (textOnly) mikro dünya içeriği, 3D olmadan aynı panelde metin olarak okunur.

import { useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { CAPABILITIES, CONCERNS } from "@/content/expertise";
import { DOMAINS } from "@/content/domains";
import { MICRO } from "@/content/microworld";
import { TONES } from "@/lib/design/palette";
import type { Focus } from "./interaction";

interface Props {
  focus: Focus | null;
  /** İkinci seviye: mikro dünya açık. */
  micro: boolean;
  /** Seçili servis (0..3) ya da null. */
  service: number | null;
  /** WebGL yok: mikro dünya içeriği metin olarak panelde. */
  textOnly: boolean;
  /** Mikro dünyaya 3D ile girilebilir mi (sahne var, geçiş sürmüyor). */
  canEnterMicro: boolean;
  onBack: () => void;
  onStep: (dir: 1 | -1) => void;
  onEnterMicro: () => void;
  onSelectService: (i: number | null) => void;
}

function Services({ service, onSelect }: { service: number | null; onSelect: (i: number | null) => void }) {
  return (
    <ul className="st-svc" aria-label="Modülün içindeki servisler">
      {MICRO.services.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            className="st-svc-btn"
            aria-pressed={service === i}
            style={{ ["--cat" as string]: TONES[s.tone] }}
            onClick={() => onSelect(service === i ? null : i)}
          >
            <span className="st-svc-idx">{s.index}</span>
            <span className="st-svc-name">{s.label}</span>
            <span className="st-svc-role">{s.role}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Concept({ service, reduce }: { service: number | null; reduce: boolean }) {
  const s = service !== null ? MICRO.services[service] : null;
  return (
    <AnimatePresence mode="wait" initial={false}>
      {s && (
        <m.div
          key={s.id}
          className="st-concept"
          style={{ ["--cat" as string]: TONES[s.tone] }}
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -6 }}
          transition={reduce ? { duration: 0 } : { duration: 0.22 }}
          aria-live="polite"
        >
          <p className="st-concept-title">{s.label}</p>
          <p className="st-focus-text">{s.concept}</p>
          <ul className="st-focus-chips" aria-label="Anahtar kavramlar">
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default function FocusPanel({ focus, micro, service, textOnly, canEnterMicro, onBack, onStep, onEnterMicro, onSelectService }: Props) {
  const reduce = useReducedMotion() ?? false;
  const heading = useRef<HTMLHeadingElement>(null);
  const t = reduce ? { duration: 0 } : { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as const };

  // Yeni alana ya da seviyeye geçildiğinde başlığa odak: klavye ve ekran okuyucu kullanıcısı içeriği duyar.
  const key = focus ? `${focus.kind}-${focus.layer}-${micro ? "micro" : "layer"}` : "";
  useEffect(() => {
    if (focus) heading.current?.focus({ preventScroll: true });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const cap = focus ? CAPABILITIES[focus.layer] : null;
  const dom = focus?.kind === "domain" ? DOMAINS.find((d) => d.layer === focus.layer) : null;
  const isBackend = focus?.kind === "layer" && focus.layer === MICRO.layer;

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {focus && cap && (
          <m.aside
            key="panel"
            className="st-focus"
            role="region"
            aria-label={micro ? "Modülün içi" : "Odaklanılan alan"}
            style={{ ["--cat" as string]: TONES[cap.tone] }}
            initial={{ opacity: 0, y: reduce ? 0 : 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 14 }}
            transition={t}
          >
            <div className="st-focus-bar">
              <button type="button" className="st-focus-back" onClick={onBack}>
                ← {micro ? MICRO.back : "Bütüne dön"} <kbd>Esc</kbd>
              </button>
              {!micro && (
                <div className="st-focus-step">
                  <button type="button" onClick={() => onStep(-1)} aria-label="Önceki alan">
                    ←
                  </button>
                  <span aria-hidden="true">
                    {String(focus.layer + 1).padStart(2, "0")} / {String(CAPABILITIES.length).padStart(2, "0")}
                  </span>
                  <button type="button" onClick={() => onStep(1)} aria-label="Sonraki alan">
                    →
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={key}
                initial={{ opacity: 0, x: reduce ? 0 : 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : -14 }}
                transition={reduce ? { duration: 0 } : { duration: 0.22 }}
              >
                {micro ? (
                  <>
                    <p className="st-focus-idx">
                      <span className="st-dot" aria-hidden="true" />
                      {MICRO.kicker}
                    </p>
                    <h2 ref={heading} tabIndex={-1} className="st-focus-title">
                      {MICRO.title}
                    </h2>
                    <p className="st-focus-text st-micro-intro">{MICRO.intro}</p>
                    <ul className="st-legend" aria-label="Akış yönleri">
                      {MICRO.legend.map((l) => (
                        <li key={l.label}>
                          <b>{l.label}</b> {l.text}
                        </li>
                      ))}
                    </ul>
                    <Services service={service} onSelect={onSelectService} />
                    <Concept service={service} reduce={reduce} />
                    <p className="st-micro-note">{MICRO.disclaimer}</p>
                  </>
                ) : (
                  <>
                    <p className="st-focus-idx">
                      <span className="st-dot" aria-hidden="true" />
                      {dom ? "Merakın Peşinde" : cap.index}
                    </p>
                    <h2 ref={heading} tabIndex={-1} className="st-focus-title">
                      {dom ? dom.label : cap.label}
                    </h2>
                    {dom ? (
                      <p className="st-focus-text">{dom.question}</p>
                    ) : (
                      <>
                        <p className="st-focus-text">{cap.description}</p>
                        <p className="st-focus-meta">
                          <b>Sahnedeki davranışı</b> {cap.behavior}
                        </p>
                        <ul className="st-focus-chips" aria-label="Her katmanı kesen konular">
                          {CONCERNS.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                        {isBackend && canEnterMicro && (
                          <button type="button" className="st-enter" onClick={onEnterMicro}>
                            {MICRO.enter} <span aria-hidden="true">→</span>
                            <small>{MICRO.enterHint}</small>
                          </button>
                        )}
                        {isBackend && textOnly && (
                          <div className="st-text-micro">
                            <p className="st-focus-meta">
                              <b>{MICRO.kicker}</b> {MICRO.intro}
                            </p>
                            <Services service={service} onSelect={onSelectService} />
                            <Concept service={service} reduce={reduce} />
                            <p className="st-micro-note">{MICRO.disclaimer}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </m.div>
            </AnimatePresence>
          </m.aside>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
