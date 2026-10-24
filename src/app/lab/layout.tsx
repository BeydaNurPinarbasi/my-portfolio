import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Deney alanı (/lab): üretimde KAPALI, açıkça ENABLE_LAB=true verilmedikçe 404.
// Not: bu kontrol build zamanında da değerlendirilir; üretimde açmak için değişken build'de de olmalı.
// Fontlar ve stiller kök layout'tan gelir.

export const metadata: Metadata = {
  title: "Strata · Hero prototipi",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_LAB !== "true") {
    notFound();
  }
  return <>{children}</>;
}
