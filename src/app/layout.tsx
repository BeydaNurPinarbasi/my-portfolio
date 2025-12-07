import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ThemeWrapper from "./components/ThemeWrapper";
import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-gray-100 dark:bg-gray-900 flex flex-col min-h-screen transition-colors duration-300">
        <ThemeWrapper>
          <Navbar />
          <main className="min-h-screen container mx-auto p-4 flex-grow">{children}</main>
          <Footer />
          <ScrollToTop />
        </ThemeWrapper>
      </body>
    </html>
  );
}
