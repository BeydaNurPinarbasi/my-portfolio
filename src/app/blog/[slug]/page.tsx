import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav, { SiteFooter } from "@/components/story/SiteNav";
import Markdown from "@/components/writing/Markdown";
import { WRITING_PAGE as W } from "@/content/writing";
import { PROFILE } from "@/content/profile";
import { postPath, ROUTES } from "@/content/routes";
import { articleJsonLd } from "@/content/seo";
import { findPublished, formatDate, headingsOf, readingMinutes, summaryOf, type Heading } from "@/lib/blog/public";

// Sunucu bileşeni: yazı HTML'de tam olarak gelir (eski sayfadaki istemci fetch'i ve "yükleniyor" yok).
// Dinamik: yazılar çalışma anında dosya deposundan (Docker volume) okunur; admin panelinden yapılan
// değişiklik yeniden build gerekmeden görünür. Bilinmeyen slug ve taslaklar 404.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function TocList({ items }: { items: Heading[] }) {
  return (
    <ol>
      {items.map((h) => (
        <li key={h.id} data-depth={h.depth}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ol>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await findPublished((await params).slug);
  if (!found) return {};
  return {
    title: `${found.post.title} · ${PROFILE.name}`,
    description: summaryOf(found.post, 160),
  };
}

export default async function PostPage({ params }: Props) {
  const found = await findPublished((await params).slug);
  if (!found) notFound();
  const { post, newer, older } = found;
  const { headings } = headingsOf(post.content);
  // İçindekiler yalnızca en üst iki seviye: uzun yazıda gezinmeyi kolaylaştırır, kalabalık yapmaz.
  const toc = headings.filter((h) => h.depth <= 3);

  return (
    <div className="imm-root st-root wr-root">
      <a className="imm-skip" href="#main">
        İçeriğe geç
      </a>
      {/* Okuma ilerlemesi: yalnız CSS (scroll-driven animation); desteklenmeyen tarayıcıda görünmez. */}
      <div className="wr-progress" aria-hidden="true" />
      <SiteNav current={postPath(post.slug)} />
      <div className="imm-bg ab-bg" aria-hidden="true" />

      <main id="main" className="wr wr-post">
        <Link className="st-link wr-back" href={ROUTES.writing}>
          ← {W.back}
        </Link>

        <article aria-labelledby="post-title">
          <header className="wr-post-head">
            <p className="wr-meta">
              <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
              <span aria-hidden="true">·</span>
              <span>
                {readingMinutes(post)} {W.readingSuffix}
              </span>
            </p>
            <h1 id="post-title" className="wr-post-title">
              {post.title}
            </h1>
          </header>

          <div className="wr-post-grid">
            {toc.length > 2 && (
              // Masaüstünde sabit kenar listesi; mobilde kapalı başlayan açılır öğe (içeriği aşağı itmesin).
              // CSS yalnızca birini gösterir; display:none olan erişilebilirlik ağacından da çıkar.
              <>
                <nav className="wr-toc" aria-label={W.toc}>
                  <p className="wr-toc-title">{W.toc}</p>
                  <TocList items={toc} />
                </nav>
                <details className="wr-toc-m">
                  <summary>
                    {W.toc} ({toc.length})
                  </summary>
                  <nav aria-label={W.toc}>
                    <TocList items={toc} />
                  </nav>
                </details>
              </>
            )}
            <Markdown source={post.content} />
          </div>
        </article>

        <aside className="wr-discuss" aria-label="Yazı hakkında">
          <p className="st-p">{W.discuss.text}</p>
          <Link className="st-btn" href={ROUTES.contact}>
            {W.discuss.label}
          </Link>
        </aside>

        {(newer || older) && (
          <nav className="wr-pager" aria-label="Diğer yazılar">
            {older && (
              <Link href={postPath(older.slug)} rel="prev">
                <span className="wr-meta">{W.prev}</span>
                <span className="wr-pager-title">{older.title}</span>
              </Link>
            )}
            {newer && (
              <Link href={postPath(newer.slug)} rel="next" className="wr-pager-next">
                <span className="wr-meta">{W.next}</span>
                <span className="wr-pager-title">{newer.title}</span>
              </Link>
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
      {/* Statik, sunucuda üretilen veri; JSON içindeki "<" kaçışlanır (yazı başlığı içerik kaynaklı). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: post.title,
              summary: summaryOf(post, 160),
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              url: `${PROFILE.url}${postPath(post.slug)}`,
            })
          ).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
