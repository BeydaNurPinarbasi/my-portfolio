import Link from "next/link";
import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import StoryGlyph from "@/components/story/StoryGlyph";
import { ROUTES } from "@/content/routes";

// 404: aynı görsel dil. Hero sahnesinin biçimi (saçılmış parçalar): aradığın yerine oturmamış.
export default function NotFound() {
  return (
    <div className="imm-root st-root ab-root">
      <SiteNav current="" />
      <div className="imm-bg ab-bg" aria-hidden="true" />
      <main className="ab nf">
        <StoryGlyph variant="scatter" className="nf-glyph" />
        <h1 className="ab-h1">Bu sayfa bulunamadı.</h1>
        <p className="ab-lead">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <div className="st-actions">
          <Link className="st-btn" href={ROUTES.home}>
            Ana sayfaya dön
          </Link>
          <Link className="st-link" href={ROUTES.writing}>
            Yazılara göz at →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
