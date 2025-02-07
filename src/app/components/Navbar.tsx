import Link from "next/link";

export default function Navbar() {
  const navItems = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/about", label: "Hakkımda" },
    { href: "/projects", label: "Projeler" },
    { href: "/contact", label: "İletişim" },
  ];

  const baseLinkStyles =
    "px-4 py-2 rounded-md transition text-black hover:bg-purple-500 hover:text-white";

  return (
    <nav className="bg-transparent text-black p-4 flex justify-between items-center fixed top-0 left-0 w-full z-10 backdrop-blur-lg shadow-lg">
      <h1 className="text-xl md:text-2xl font-bold whitespace-nowrap">
        Beyda.dev
      </h1>
      <div className="hidden md:flex space-x-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={baseLinkStyles}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
