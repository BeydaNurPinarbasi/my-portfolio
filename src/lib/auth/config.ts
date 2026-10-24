// Admin kimlik doğrulamasının SADECE sunucu tarafı yapılandırması.
// Hiçbir değer NEXT_PUBLIC_ ile başlamaz: istemci bundle'ına asla girmemeli.
//
// Fail-closed: bu üç değişkenden biri eksik/zayıfsa admin girişi ve tüm admin
// mutasyonları kapalıdır. "Varsayılan kullanıcı/parola" fallback'i bilerek yoktur.

export interface AdminConfig {
  email: string;
  passwordHash: string;
  sessionSecret: string;
}

const MIN_SECRET_LENGTH = 32;

export function getAdminConfig(): AdminConfig | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = process.env.SESSION_SECRET?.trim();

  if (!email || !passwordHash || !sessionSecret) return null;
  if (sessionSecret.length < MIN_SECRET_LENGTH) return null;
  if (!passwordHash.startsWith("scrypt$")) return null;

  return { email, passwordHash, sessionSecret };
}

export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 saat

// `__Host-` öneki: Secure + Path=/ + Domain yok şartını tarayıcıya zorlatır.
// Secure cookie localhost'ta http üzerinde çalışmadığı için sadece production'da.
export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-bd_admin" : "bd_admin";
}
