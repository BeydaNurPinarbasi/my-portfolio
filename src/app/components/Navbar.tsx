"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // Lucide ikonları kullanıldı

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/about", label: "Hakkımda" },
    { href: "/projects", label: "Projeler" },
    { href: "/contact", label: "İletişim" },
  ];

  const baseLinkStyles =
    "block px-4 py-2 rounded-md transition bg-white text-purple-700 hover:bg-purple-500 hover:text-white";

  return (
    <nav className="bg-purple-700 text-white p-4 flex justify-between items-center rounded-lg shadow-lg">
      <h1 className="text-xl font-bold">Beyda.dev</h1>

      {/* Menü Butonu (Mobil için) */}
      <button
        className="md:hidden p-2 rounded-md bg-white text-purple-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Büyük Ekran Menü */}
      <div className="hidden md:flex space-x-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={baseLinkStyles}>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Küçük Ekran Açılır Menü */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-purple-800 md:hidden flex flex-col items-center p-4 rounded-b-lg shadow-lg transition-all">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block w-full text-center px-4 py-2 text-white hover:bg-purple-600 rounded-md transition"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
