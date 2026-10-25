import Image from "next/image";
import Link from "next/link";
import wordmark from "@/assets/brand/logo-wordmark.png"; // şeffaf, kırpılmış, 720 px (kaynak: logo.png)
import { PROFILE } from "@/content/profile";
import { ROUTES } from "@/content/routes";

// Site gezinmesi. Bağlantılar content/routes.ts'ten (production'a taşınırken tek yerden değişir).
const LINKS = [
  { href: ROUTES.home, label: "Ana sayfa" },
  { href: ROUTES.about, label: "Hakkımda" },
  { href: ROUTES.writing, label: "Yazılar" },
  { href: ROUTES.contact, label: "İletişim" },
];

export default function SiteNav({ current }: { current: string }) {
  return (
    <header className="st-nav">
      {/* Logo ana sayfaya bağlanır. Görsel metin içerdiği için alt = "beyda.dev"; bağlantının adı tam ifade. */}
      <Link className="st-nav-logo" href={ROUTES.home} aria-label={`${PROFILE.name}, ana sayfa`}>
        <Image src={wordmark} alt="beyda.dev" priority sizes="140px" />
      </Link>
      <nav aria-label="Ana gezinme">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={current === l.href ? "page" : current.startsWith(`${l.href}/`) ? "true" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="st-footer">
      <span>{PROFILE.name}</span>
      <span>{PROFILE.title}</span>
    </footer>
  );
}
