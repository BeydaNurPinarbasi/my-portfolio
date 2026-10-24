import StoryStage from "@/components/story/StoryStage";
import { ROUTES } from "@/content/routes";
import { StorySections } from "@/components/story/sections";
import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import { HOME_META, personJsonLd } from "@/content/seo";

// Sunucu bileşeni: tüm hikâye metni HTML'de. StoryStage yalnızca sahne ve hareketi ekler.
export const metadata = HOME_META;

export default function HomePage() {
  return (
    // Token'lar (.imm-root) gezinme ve altbilgiyi de kapsasın diye sayfa kökünde.
    <div className="imm-root st-root">
      <a className="imm-skip" href="#main">
        İçeriğe geç
      </a>
      <SiteNav current={ROUTES.home} />
      <main id="main">
        <StoryStage>
          <StorySections />
        </StoryStage>
      </main>
      <SiteFooter />
      {/* Statik, sunucuda üretilen veri (kullanıcı girdisi yok). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
    </div>
  );
}
