"use client";
import React from "react";
import { ThemeProvider } from "../contexts/ThemeContext";

// Not: Eskiden burada istemci tarafı AuthProvider vardı. Kaldırıldı: kimlik
// doğrulama artık tamamen sunucudadır (proxy.ts + requireAdmin).
export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
