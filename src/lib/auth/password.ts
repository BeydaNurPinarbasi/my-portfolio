// Parola doğrulama (yalnızca Node runtime: node:crypto scrypt).
// Hash biçimi: scrypt$N$r$p$<salt b64>$<hash b64>
// Hash'i scripts/generate-admin-credentials.mjs üretir.

import { createHash, scrypt, timingSafeEqual } from "node:crypto";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  opts: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { ...opts, maxmem: 128 * opts.N * opts.r * 2 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![N, r, p].every(Number.isInteger) || N < 2 ** 14 || N > 2 ** 20) return false;

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (salt.length < 16 || expected.length < 32) return false;

  const actual = await scryptAsync(password, salt, expected.length, { N, r, p });
  return timingSafeEqual(actual, expected);
}

// E-posta karşılaştırması: uzunluk bilgisi sızdırmamak için önce SHA-256.
export function safeEqualStrings(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// E-posta yanlış olsa bile scrypt maliyetini ödemek için kullanılan sahte hash:
// yanıt süresinden "bu e-posta doğru mu" bilgisi çıkarılamasın.
export const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
