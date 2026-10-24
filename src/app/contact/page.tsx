import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import StoryGlyph from "@/components/story/StoryGlyph";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT_CHANNELS, CONTACT_PAGE as C } from "@/content/contact";
import { ROUTES } from "@/content/routes";
import { CONTACT_META } from "@/content/seo";

// Sunucu bileşeni; yalnızca form istemcide çalışır.
export const metadata = CONTACT_META;

export default function ContactPage() {
  return (
    <div className="imm-root st-root ct-root">
      <a className="imm-skip" href="#main">
        İçeriğe geç
      </a>
      <SiteNav current={ROUTES.contact} />
      <div className="imm-bg ab-bg" aria-hidden="true" />
      <main id="main" className="ct">
        <section className="ct-intro" aria-labelledby="ct-title">
          <p className="st-eyebrow">{C.eyebrow}</p>
          <h1 id="ct-title" className="ab-h1">
            {C.title}
          </h1>
          <div className="ct-approach">
            {C.approach.map((p) => (
              <p key={p} className="st-p">
                {p}
              </p>
            ))}
          </div>

          <h2 className="ct-label">{C.channelsTitle}</h2>
          <ul className="ct-channels">
            {CONTACT_CHANNELS.map((c) => (
              <li key={c.id}>
                <a href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="ct-channel-label">{c.label}</span>
                  <span className="ct-channel-value">{c.value}</span>
                  {c.external && <span className="imm-sr"> (yeni sekmede açılır)</span>}
                </a>
              </li>
            ))}
          </ul>
          {/* Gelecek sahnesinin biçimi: farklı parçaların ortak, dengeli bir yapı kurması (iş birliği). */}
          <StoryGlyph variant="disc" className="ct-glyph" />
        </section>

        <section className="ct-card" aria-labelledby="ct-form-title">
          <h2 id="ct-form-title" className="ab-h3">
            {C.formTitle}
          </h2>
          <ContactForm />
          <p className="ct-privacy">{C.privacy}</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
