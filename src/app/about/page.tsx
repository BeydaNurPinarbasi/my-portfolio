import Link from "next/link";
import { ROUTES } from "@/content/routes";
import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import AboutGallery from "@/components/about/AboutGallery";
import { ABOUT_INTRO, ABOUT_SECTIONS } from "@/content/about";
import { DOMAINS } from "@/content/domains";
import { CONCERNS } from "@/content/expertise";
import { pillar } from "@/content/pillars";
import { HOME_CONTACT } from "@/content/home";
import { ABOUT_META, personJsonLd } from "@/content/seo";
import "@/components/about/about-gallery.css";

// Hakkımda: neoklasik heykel galerisi, sayfa boyunca. Sticky 3D sahne (büst, sütun, kabartma) istemcide;
// Hakkımda bölümleri sunucuda üretilen gerçek HTML'dir ve her biri bir kamera istasyonudur (data-station).
// Metinler about.ts'ten, değiştirilmeden. WebGL/JS yokken sayfa düz metin olarak aynen okunur.
export const metadata = ABOUT_META;

export default function AboutPage() {
  return (
    <div className="imm-root st-root ab-root">
      <a className="imm-skip" href="#main">
        İçeriğe geç
      </a>
      <SiteNav current={ROUTES.about} />
      <main id="main">
        <AboutGallery>
          <section data-station="overview" className="ag-sec ag-hero" aria-labelledby="ab-h1">
            <h1 id="ab-h1" className="cl-h1">
              {ABOUT_INTRO.title}
            </h1>
            <p className="cl-lead">{ABOUT_INTRO.lead}</p>
            <p className="ag-cue">
              Kaydır, heykelin etrafında ilerle <span aria-hidden="true">↓</span>
            </p>
          </section>

          {ABOUT_SECTIONS.map((s, i) => {
            const p = pillar(s.pillar);
            const firstOfPillar = ABOUT_SECTIONS.findIndex((x) => x.pillar === s.pillar) === i;
            return (
              <section key={s.id} id={s.id} data-station={s.id} className="ag-sec" aria-labelledby={`${s.id}-t`}>
                {firstOfPillar && (
                  <div className="ag-act">
                    <p className="ag-act-num" aria-hidden="true">
                      {p.numeral}
                    </p>
                    <h2 className="ag-act-title">{p.title}</h2>
                    <p className="ag-act-def">{p.definition}</p>
                  </div>
                )}
                <article className="ag-card">
                  <p className="cl-kicker">
                    <span aria-hidden="true">{p.numeral}</span> {p.title}
                  </p>
                  <h3 id={`${s.id}-t`} className="cl-title">
                    {s.title}
                  </h3>
                  {s.paragraphs.map((t) => (
                    <p key={t} className="cl-p">
                      {t}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="cl-list">
                      {s.list.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {s.id === "beyond" && (
                    <ul className="cl-qs" aria-label="Merak ettiğim alanlar">
                      {DOMAINS.map((d) => (
                        <li key={d.id}>
                          <b>{d.label}</b> {d.question}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.id === "holistic" && (
                    <ul className="cl-chips" aria-label="Her katmanı kesen konular">
                      {CONCERNS.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                  {s.note && <p className="cl-note">{s.note}</p>}
                  {s.link && (
                    <Link className="cl-link" href={s.link.href}>
                      {s.link.label} →
                    </Link>
                  )}
                </article>
              </section>
            );
          })}

          {/* Kapanış: kamera "Gelecek" istasyonunda geri çekilmiş kalır. */}
          <section data-station="future" className="ag-sec ag-close" aria-labelledby="ab-close-t">
            <article className="ag-card">
              <h2 id="ab-close-t" className="cl-title">
                {HOME_CONTACT.title}
              </h2>
              <p className="cl-p">{HOME_CONTACT.body}</p>
              <Link className="cl-start" href={HOME_CONTACT.primary.href}>
                {HOME_CONTACT.primary.label} <span aria-hidden="true">→</span>
              </Link>
            </article>
          </section>
        </AboutGallery>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
    </div>
  );
}
