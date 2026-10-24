import Link from "next/link";
import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import StoryGlyph from "@/components/story/StoryGlyph";
import { WRITING_PAGE as W } from "@/content/writing";
import { postPath, ROUTES } from "@/content/routes";
import { WRITING_META } from "@/content/seo";
import { formatDate, listPublished, readingMinutes, summaryOf } from "@/lib/blog/public";

// Sunucu bileşeni: yazılar doğrudan depodan okunur (istemci fetch'i ve "yükleniyor" durumu yok).
// Yalnızca yayınlanmış yazılar listelenir. Dinamik: admin değişiklikleri build gerektirmez.
export const metadata = WRITING_META;
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await listPublished();
  const [featured, ...rest] = posts;

  return (
    <div className="imm-root st-root wr-root">
      <a className="imm-skip" href="#main">
        İçeriğe geç
      </a>
      <SiteNav current={ROUTES.writing} />
      <div className="imm-bg ab-bg" aria-hidden="true" />
      <main id="main" className="wr">
        <header className="wr-head">
          <div>
            <h1 className="ab-h1">{W.title}</h1>
            <p className="ab-lead">{W.lead}</p>
          </div>
          {/* Merak sahnesinin biçimi: bilgi alanları ve aralarındaki bağlar */}
          <StoryGlyph variant="field" className="wr-glyph" />
        </header>

        {posts.length === 0 && <p className="st-p">{W.empty}</p>}

        {featured && (
          <article className="wr-feature" aria-labelledby={`p-${featured.slug}`}>
            <p className="wr-meta">
              <time dateTime={featured.createdAt}>{formatDate(featured.createdAt)}</time>
              <span aria-hidden="true">·</span>
              <span>
                {readingMinutes(featured)} {W.readingSuffix}
              </span>
            </p>
            <h2 id={`p-${featured.slug}`} className="wr-feature-title">
              <Link href={postPath(featured.slug)} className="wr-stretch">
                {featured.title}
              </Link>
            </h2>
            <p className="wr-summary">{summaryOf(featured, 280)}</p>
            <span className="wr-arrow" aria-hidden="true">
              Oku →
            </span>
          </article>
        )}

        {rest.length > 0 && (
          <ol className="wr-list">
            {rest.map((p) => (
              <li key={p.id}>
                <article className="wr-row" aria-labelledby={`p-${p.slug}`}>
                  <p className="wr-meta">
                    <time dateTime={p.createdAt}>{formatDate(p.createdAt)}</time>
                    <span aria-hidden="true">·</span>
                    <span>
                      {readingMinutes(p)} {W.readingSuffix}
                    </span>
                  </p>
                  <h2 id={`p-${p.slug}`} className="wr-row-title">
                    <Link href={postPath(p.slug)} className="wr-stretch">
                      {p.title}
                    </Link>
                  </h2>
                  <p className="wr-summary">{summaryOf(p)}</p>
                </article>
              </li>
            ))}
          </ol>
        )}

        <section className="wr-intent" aria-labelledby="wr-intent-t">
          <h2 id="wr-intent-t" className="ab-h3">
            {W.intentTitle}
          </h2>
          <p className="st-p">{W.intent}</p>
          <ul className="wr-kinds">
            {W.kinds.map((k) => (
              <li key={k.label}>
                <strong>{k.label}</strong>
                <span>{k.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
