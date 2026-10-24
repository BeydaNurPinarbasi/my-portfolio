// Ana sayfa hikâye bölümleri: SUNUCU bileşenleri. Tüm metin HTML'de; JS ve WebGL olmadan da okunur.
// Hareket StoryStage'te (istemci) data-* öznitelikleri üzerinden eklenir.

import Link from "next/link";
import type { Chapter, PillarId } from "@/content/types";
import { PROFILE } from "@/content/profile";
import { pillar } from "@/content/pillars";
import { HOME_CHAPTERS, HOME_CONTACT, HOME_HERO, HOME_WORK, INQUIRY_QUESTIONS } from "@/content/home";
import { DOMAINS } from "@/content/domains";
import { CAPABILITIES, CONCERNS } from "@/content/expertise";
import { VALUES } from "@/content/values";
import { publicWork } from "@/content/work";
import { TONES } from "@/lib/design/palette";
import { SECTION_ORDER, type SectionId } from "./choreography";

const cat = (layer: number) => ({ ["--cat" as string]: TONES[CAPABILITIES[layer].tone] });

/** Erişilebilir bölünmüş metin: ekran okuyucu tek parça okur, parçalar dekoratif. */
function Split({ text, by }: { text: string; by: "char" | "word" }) {
  const parts = by === "char" ? Array.from(text) : text.split(" ");
  return (
    <>
      <span className="imm-sr">{text}</span>
      <span aria-hidden="true">
        {parts.map((p, i) =>
          by === "char" ? (
            <span key={i} className="imm-c" style={{ ["--i" as string]: i }}>
              {p}
            </span>
          ) : (
            <span key={i} className="st-word">
              {p}
              {i < parts.length - 1 ? " " : ""}
            </span>
          )
        )}
      </span>
    </>
  );
}

function Hero() {
  const [l1, l2] = HOME_HERO.title.split(", ");
  return (
    <section id="hero" data-section="hero" className="st-sec st-hero" aria-labelledby="hero-title">
      <div className="st-copy">
        <p className="st-eyebrow">
          {PROFILE.name} · {HOME_HERO.eyebrow}
        </p>
        <h1 id="hero-title" className="st-h1">
          <span className="imm-sr">{HOME_HERO.title}</span>
          {[`${l1},`, l2].map((line, n) => (
            <span key={n} className="imm-line" aria-hidden="true">
              {Array.from(line).map((ch, i) => (
                <span key={i} className="imm-c" style={{ ["--i" as string]: i + n * 6 }}>
                  {/* inline-block içindeki düz boşluk genişliksiz kalır; kelime arası korunur. */}
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="st-lead">{HOME_HERO.lead}</p>
      </div>
      <div className="st-cue" aria-hidden="true">
        <span>Kaydır</span>
        <i />
      </div>
    </section>
  );
}

function Act({ id, pillarId }: { id: SectionId; pillarId: PillarId }) {
  const p = pillar(pillarId);
  return (
    <section id={id} data-section={id} className="st-sec st-act" aria-labelledby={`${id}-title`}>
      <p className="st-act-num" aria-hidden="true">
        {p.numeral}
      </p>
      <h2 id={`${id}-title`} className="st-act-word">
        {p.title}
      </h2>
      <p className="st-act-def">{p.definition}</p>
    </section>
  );
}

function ChapterExtras({ chapter }: { chapter: Chapter }) {
  switch (chapter.scene) {
    case "beyond":
      return (
        <ul className="st-domains" aria-label="Yazılım dışındaki ilgi alanları">
          {DOMAINS.map((d) => (
            <li key={d.id} style={cat(d.layer)}>
              {/* Gerçek düğme: klavye/dokunma ile de seçilir; seçili alan 3D'de öne çıkar. */}
              <button type="button" className="st-domain" data-domain={d.layer} aria-pressed="false">
                <span className="st-dot" aria-hidden="true" />
                <span className="st-domain-label">{d.label}</span>
                <span className="st-domain-q">{d.question}</span>
              </button>
            </li>
          ))}
        </ul>
      );
    case "layers":
      return (
        <>
          <ol className="st-caps" aria-label="Yetkinlik alanları">
            {CAPABILITIES.map((c, i) => (
              <li key={c.id} className="st-cap" data-layer={i} data-active="false" style={cat(i)}>
                <span className="st-cap-idx" aria-hidden="true">
                  {c.index}
                </span>
                <span className="st-cap-name">{c.label}</span>
                <span className="st-cap-desc">{c.description}</span>
              </li>
            ))}
          </ol>
          <ul className="st-concerns" aria-label="Her katmanı kesen konular">
            {CONCERNS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      );
    case "inquiry":
      return (
        <ol className="st-inquiry">
          {INQUIRY_QUESTIONS.map((q) => (
            <li key={q.label}>
              <span className="st-rule" aria-hidden="true" />
              <h4>{q.label}</h4>
              <p>{q.question}</p>
            </li>
          ))}
        </ol>
      );
    case "approach":
      return (
        <ul className="st-values" aria-label="İş ilişkilerinde önem verdiğim değerler">
          {VALUES.map((v) => (
            <li key={v.id} className="st-value">
              {v.label}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

function ChapterSection({ chapter }: { chapter: Chapter }) {
  const id = chapter.id as SectionId;
  return (
    <section id={id} data-section={id} className={`st-sec st-ch st-ch--${chapter.scene}`} aria-labelledby={`${id}-title`}>
      <div className="st-copy">
        <p className="st-eyebrow">
          <span className="st-idx">{chapter.index}</span> {chapter.eyebrow}
        </p>
        <h3 id={`${id}-title`} className="st-h3">
          <Split text={chapter.title} by="word" />
        </h3>
        <div className="st-body">
          {chapter.body.map((p) => (
            <p key={p} className="st-p">
              {p}
            </p>
          ))}
        </div>
        <ChapterExtras chapter={chapter} />
        {chapter.note && <p className="st-note">{chapter.note}</p>}
        {chapter.link && (
          <Link className="st-link" href={chapter.link.href}>
            {chapter.link.label} →
          </Link>
        )}
      </div>
    </section>
  );
}

function Work() {
  const items = publicWork();
  return (
    <section id="work" data-section="work" className="st-sec st-plain" aria-labelledby="work-title">
      <div className="st-copy">
        <h2 id="work-title" className="st-h2">
          {HOME_WORK.title}
        </h2>
        {items.length === 0 ? (
          <p className="st-p">{HOME_WORK.emptyNote}</p>
        ) : (
          <ul className="st-work">
            {items.map((w) => (
              <li key={w.slug}>
                <h3 className="st-h4">{w.title}</h3>
                <p className="st-p">{w.summary}</p>
                <p className="st-meta">{w.stack.join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" data-section="contact" className="st-sec st-plain st-contact" aria-labelledby="contact-title">
      <div className="st-copy">
        <h2 id="contact-title" className="st-h2 st-h2--big">
          {HOME_CONTACT.title}
        </h2>
        <p className="st-p">{HOME_CONTACT.body}</p>
        <div className="st-actions">
          <Link className="st-btn" href={HOME_CONTACT.primary.href}>
            {HOME_CONTACT.primary.label}
          </Link>
          <Link className="st-link" href={HOME_CONTACT.secondary.href}>
            {HOME_CONTACT.secondary.label} →
          </Link>
        </div>
      </div>
    </section>
  );
}

const ACTS: Partial<Record<SectionId, PillarId>> = {
  "act-merak": "merak",
  "act-uretim": "uretim",
  "act-sorumluluk": "sorumluluk",
};

/** Bölümler SECTION_ORDER'dan üretilir: DOM sırası ile koreografi sırası aynı kaynaktan gelir. */
export function StorySections() {
  return (
    <>
      {SECTION_ORDER.map((id) => {
        if (id === "hero") return <Hero key={id} />;
        if (id === "work") return <Work key={id} />;
        if (id === "contact") return <Contact key={id} />;
        const act = ACTS[id];
        if (act) return <Act key={id} id={id} pillarId={act} />;
        const chapter = HOME_CHAPTERS.find((c) => c.id === id);
        if (!chapter) throw new Error(`İçerik eksik: ${id}`);
        return <ChapterSection key={id} chapter={chapter} />;
      })}
    </>
  );
}
