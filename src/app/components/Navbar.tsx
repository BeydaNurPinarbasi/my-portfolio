"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/about", label: "Hakkımda" },
    { href: "/contact", label: "İletişim" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-300 z-10"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg text-black dark:text-white p-4 fixed top-0 left-0 w-full z-20 shadow-lg transition-colors duration-300">
        <div className="flex justify-between items-center">
          {/* **Ana Sayfa Linki** */}
          <Link href="/" className="text-xl md:text-xl font-bold whitespace-nowrap">
            Beyda.dev
          </Link>

          {/* **BÜYÜK EKRANLAR İÇİN MENÜ** */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg font-serif text-black dark:text-white hover:text-purple-500 dark:hover:text-purple-400 transition"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* **MOBİLDE HAMBURGER MENÜ** */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <button
              className="font-serif p-2"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={32} className="text-purple-500" />
            </button>
          </div>
        </div>

        {/* **MOBİLDE TAM EKRAN AÇILAN MENÜ** */}
        <div
          className={`fixed top-0 left-0 w-full min-h-screen bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Kapatma Butonu */}
          <button
            className="absolute top-4 right-4 text-black dark:text-white p-2"
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
                className="block px-2 py-3 text-xl font-serif text-black dark:text-white hover:bg-purple-500 hover:text-white transition rounded-lg"
                onClick={() => setIsOpen(false)}
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
