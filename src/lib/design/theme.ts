// Tema durumu: <html data-theme="dark|light"> tek kaynak. CSS token'ları buna bakar; 3D sahneler
// onThemeChange ile canlı izler (uniform ve malzeme renklerini yerinde günceller, sahne yeniden kurulmaz).
// Varsayılan koyu. İlk boyamada titreme olmaması için layout.tsx içindeki satır içi betik kayıtlı seçimi uygular.
import { THEMES } from "./palette";

export type ThemeName = "dark" | "light";
// Admin panelinin ThemeProvider'ı "theme" anahtarını kullanır; karışmasın diye ayrı anahtar.
export const THEME_STORAGE_KEY = "site-theme";
const EVENT = "themechange";

export function currentTheme(): ThemeName {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(t: ThemeName): void {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* özel gezinti: seçim yalnızca bu oturumda kalır */
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES[t].bg);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: t }));
}

export function onThemeChange(cb: (t: ThemeName) => void): () => void {
  const h = () => cb(currentTheme());
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** "#rrggbb" → 0..1 sRGB bileşenleri, mevcut vektörün üzerine yazar (uniform referansı korunur). */
export function setSrgb(v: { set(x: number, y: number, z: number): unknown }, hex: string): void {
  const n = parseInt(hex.slice(1), 16);
  v.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
