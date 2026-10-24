import Link from "next/link";
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
      <Link className="st-nav-name" href={ROUTES.home}>
        {PROFILE.name}
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
