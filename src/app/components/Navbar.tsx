"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/about", label: "Hakkımda" },
    { href: "/projects", label: "Projeler" },
    { href: "/contact", label: "İletişim" },
  ];

  return (
    <>
      {/* Menü Açıldığında Arka Planı Koyulaştır */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-300 z-10"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <nav className="bg-transparent  text-black p-4 fixed top-0 left-0 w-full z-20 backdrop-blur-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-xl  font-bold whitespace-nowrap">
            Beyda.dev
          </h1>

          {/* **BÜYÜK EKRANLAR İÇİN MENÜ** */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg font-serif text-black hover:text-purple-500 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* **MOBİLDE HAMBURGER MENÜ** */}
          <button
            className="md:hidden font-serif text-black p-2"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={32} className="text-purple-500" />
          </button>
        </div>

        {/* **MOBİLDE TAM EKRAN AÇILAN MENÜ** */}
        <div
          className={`fixed top-0 left-0 w-full min-h-screen bg-white shadow-lg transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Kapatma Butonu */}
          <button
            className="absolute top-4 right-4 text-black p-2"
            onClick={() => setIsOpen(false)}
          >
            <X size={32} className="text-purple-500" />
          </button>

          {/* Menü İçeriği */}
          <div className="flex flex-col items-center justify-center h-full space-y-6 p-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-2 py-3 text-xl font-serif text-black hover:bg-purple-500 hover:text-white transition rounded-lg"
                onClick={() => setIsOpen(false)} // Menü seçildiğinde kapansın
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
