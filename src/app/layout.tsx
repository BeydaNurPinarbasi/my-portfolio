import React from "react";
import ThemeWrapper from "./components/ThemeWrapper";
import PublicLayout from "./components/PublicLayout";
import "./styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-background flex flex-col min-h-screen transition-colors duration-300">
        <ThemeWrapper>
          <PublicLayout>{children}</PublicLayout>
        </ThemeWrapper>
      </body>
    </html>
  );
}
