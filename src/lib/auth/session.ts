// Durumsuz (stateless) imzalı oturum token'ı. Web Crypto kullanır; bu yüzden
// hem Route Handler'larda hem proxy.ts içinde aynı kod çalışır.
//
// Biçim: v1.<payload b64url>.<HMAC-SHA256 b64url>
// Payload: { sub, iat, exp, cv }
//   cv = parola hash'inin parmak izi. Parola değiştirilince (ADMIN_PASSWORD_HASH
//   rotate) mevcut tüm oturumlar otomatik geçersiz olur.
//
// Sınır: durumsuz olduğu için tek tek oturum iptal edilemez; kısa TTL (8 saat)
// ile telafi edilir. Tümünü iptal etmek için SESSION_SECRET değiştirilir.

import { getAdminConfig, SESSION_TTL_SECONDS } from "./config";

export interface SessionPayload {
  sub: "admin";
  iat: number;
  exp: number;
  cv: string;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array | null {
  try {
    const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
    const bin = atob(input.replace(/-/g, "+").replace(/_/g, "/") + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

async function credentialVersion(passwordHash: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(passwordHash));
  return toBase64Url(new Uint8Array(digest)).slice(0, 16);
}

export async function createSessionToken(): Promise<string | null> {
  const config = getAdminConfig();
  if (!config) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    cv: await credentialVersion(config.passwordHash),
  };

  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(config.sessionSecret, "sign");
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`v1.${body}`));
  return `v1.${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || token.length > 1024) return null;

  const config = getAdminConfig();
  if (!config) return null; // fail-closed

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const sig = fromBase64Url(parts[2]);
  if (!sig) return null;

  // subtle.verify sabit zamanlı karşılaştırma yapar.
  const key = await hmacKey(config.sessionSecret, "verify");
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sig as BufferSource,
    encoder.encode(`v1.${parts[1]}`)
  );
  if (!valid) return null;

  const raw = fromBase64Url(parts[1]);
  if (!raw) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.sub !== "admin" || typeof payload.exp !== "number" || payload.exp <= now) {
    return null;
  }
  if (payload.cv !== (await credentialVersion(config.passwordHash))) return null;

  return payload;
}
