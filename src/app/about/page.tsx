import Link from "next/link";
import { ROUTES } from "@/content/routes";
import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import StoryGlyph, { type GlyphVariant } from "@/components/story/StoryGlyph";
import Constellation from "@/components/story/about/Constellation";
import { ABOUT_INTRO, ABOUT_SECTIONS } from "@/content/about";
import { PILLARS } from "@/content/pillars";
import { CONCERNS } from "@/content/expertise";
import { HOME_CONTACT } from "@/content/home";
import { ABOUT_META, personJsonLd } from "@/content/seo";
import type { PillarId } from "@/content/types";

// Hakkımda: uzun okuma sayfası. Sunucu bileşeni; WebGL yok (performans ve okuma önceliği).
// Aynı üç perde (Merak -> Üretim -> Sorumluluk), ana sayfadaki özetten farklı ve daha derin metin.
export const metadata = ABOUT_META;

const GLYPH: Record<PillarId, GlyphVariant> = { merak: "field", uretim: "layers", sorumluluk: "disc" };

export default function AboutPage() {
  return (
    <div className="imm-root st-root ab-root">
      <a className="imm-skip" href="#main">
        İçeriğe geç
      </a>
      <SiteNav current={ROUTES.about} />
      <div className="imm-bg ab-bg" aria-hidden="true" />
      <main id="main" className="ab">
        <header className="ab-intro">
          <h1 className="ab-h1">{ABOUT_INTRO.title}</h1>
          <p className="ab-lead">{ABOUT_INTRO.lead}</p>
        </header>

        {PILLARS.map((p) => (
          <section key={p.id} className="ab-act" aria-labelledby={`ab-${p.id}`}>
            <div className="ab-act-head">
              <p className="st-act-num" aria-hidden="true">
                {p.numeral}
              </p>
              <h2 id={`ab-${p.id}`} className="ab-act-title">
                {p.title}
              </h2>
              <p className="st-act-def">{p.definition}</p>
              <StoryGlyph variant={GLYPH[p.id]} className="ab-glyph" />
            </div>

            <div className="ab-act-body">
              {ABOUT_SECTIONS.filter((s) => s.pillar === p.id).map((s) => (
                <article key={s.id} id={s.id} className="ab-sec" aria-labelledby={`${s.id}-t`}>
                  <h3 id={`${s.id}-t`} className="ab-h3">
                    {s.title}
                  </h3>
                  {s.paragraphs.map((t) => (
                    <p key={t} className="st-p">
                      {t}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="ab-list">
                      {s.list.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {s.id === "beyond" && <Constellation />}
                  {s.id === "holistic" && (
                    <ul className="st-concerns ab-concerns" aria-label="Her katmanı kesen konular">
                      {CONCERNS.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                  {s.note && <p className="st-note">{s.note}</p>}
                  {s.link && (
                    <Link className="st-link" href={s.link.href}>
                      {s.link.label} →
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="ab-close" aria-labelledby="ab-close-t">
          <h2 id="ab-close-t" className="st-h2 st-h2--big">
            {HOME_CONTACT.title}
          </h2>
          <p className="st-p">{HOME_CONTACT.body}</p>
          <div className="st-actions">
            <Link className="st-btn" href={HOME_CONTACT.primary.href}>
              {HOME_CONTACT.primary.label}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
    </div>
  );
}
