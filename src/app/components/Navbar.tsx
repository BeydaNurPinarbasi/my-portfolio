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

      <nav className="bg-transparent text-black p-4 fixed top-0 left-0 w-full z-20 backdrop-blur-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold whitespace-nowrap">
            Beyda.dev
          </h1>

          {/* **BÜYÜK EKRANLAR İÇİN MENÜ** */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg text-black hover:text-purple-500 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* **MOBİLDE HAMBURGER MENÜ** */}
          <button
            className="md:hidden text-black p-2"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={32} className="text-purple-500" />
          </button>
        </div>

        {/* **MOBİLDE SAĞDAN AÇILAN MENÜ** */}
        <div
          className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${
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
          <div className="flex flex-col mt-16 space-y-4 p-6 bg-white">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-lg text-black hover:bg-purple-500 hover:text-white transition"
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
