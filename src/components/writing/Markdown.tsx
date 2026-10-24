// Yazı gövdesi: SUNUCU bileşeni (istemciye markdown ayrıştırıcısı gönderilmez).
// Güvenlik: react-markdown varsayılan olarak ham HTML'i render etmez ve tehlikeli URL'leri
// (javascript: vb.) temizler; rehype-raw bilinçli olarak eklenmedi.

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { headingsOf } from "@/lib/blog/public";
import { PROFILE } from "@/content/profile";

type HeadingTag = "h2" | "h3" | "h4" | "h5" | "h6";

export default function Markdown({ source }: { source: string }) {
  const { headings } = headingsOf(source);
  // Başlıklar belge sırasıyla render edilir; headingsOf aynı sırayla aynı id ve seviyeyi üretir.
  let n = 0;
  const heading = ({ children }: { children?: ReactNode }) => {
    const h = headings[n++];
    const Tag = (`h${h ? Math.max(2, h.depth) : 2}`) as HeadingTag;
    return (
      <Tag id={h?.id} className="wr-h">
        {children}
      </Tag>
    );
  };

  const own = new URL(PROFILE.url).host;
  const components: Components = {
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
    a: ({ href = "", children }: ComponentPropsWithoutRef<"a">) => {
      const external = /^https?:\/\//.test(href) && !href.includes(own);
      return external ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
          <span className="imm-sr"> (yeni sekmede açılır)</span>
        </a>
      ) : (
        <a href={href}>{children}</a>
      );
    },
    // eslint-disable-next-line @next/next/no-img-element -- yazı görselleri dış kaynaklı olabilir; boyut bilinmiyor
    img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" />,
  };

  return (
    <div className="wr-prose">
      <ReactMarkdown components={components}>{source}</ReactMarkdown>
    </div>
  );
}
