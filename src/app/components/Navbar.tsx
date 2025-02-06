import Link from "next/link";

export default function Navbar() {
  const navItems = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/about", label: "Hakkımda" },
    { href: "/projects", label: "Projeler" },
    { href: "/contact", label: "İletişim" },
  ];

  const baseLinkStyles =
    "px-4 py-2 rounded-md transition bg-white text-purple-700 hover:bg-purple-500 hover:text-white";

  return (
    <nav className="bg-purple-700 text-white p-4 flex justify-between items-center rounded-lg shadow-lg">
      <h1 className="text-xl font-bold">Beyda.dev</h1>
      <div className="space-x-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={baseLinkStyles}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
