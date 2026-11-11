"use client";
// Açık/koyu geçiş düğmesi. Durumun tek kaynağı <html data-theme> (lib/design/theme.ts); burada yalnızca okunur ve değiştirilir.
// 3D sahneler ve CSS değişimi kendileri izler. İlk render sunucuyla aynı (koyu); gerçek durum mount'ta okunur.
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { currentTheme, onThemeChange, setTheme, type ThemeName } from "@/lib/design/theme";

export default function ThemeToggle() {
  const [theme, setLocal] = useState<ThemeName>("dark");

  useEffect(() => {
    setLocal(currentTheme());
    return onThemeChange(setLocal);
  }, []);

  const next: ThemeName = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? "Açık temaya geç" : "Koyu temaya geç";

  return (
    <button type="button" className="st-theme" onClick={() => setTheme(next)} aria-label={label} title={label}>
      {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}
