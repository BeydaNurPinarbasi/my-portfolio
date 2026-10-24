// Cihaz yeteneğine göre sahne seviyesi seçimi. Yalnızca tarayıcıda çağrılmalı.

export type SceneTier = "full" | "lite" | "static" | "none";

export function hasWebGL2(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    // Test bağlamını hemen bırak: sayfa başına bağlam sayısı sınırlı.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

export function detectTier(): SceneTier {
  if (!hasWebGL2()) return "none";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;

  return coarse || narrow || lowMemory || lowCores ? "lite" : "full";
}
