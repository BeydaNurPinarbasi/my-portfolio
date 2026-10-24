#!/usr/bin/env node
// Admin kimlik bilgisi değişkenlerini üretir. Parola komut satırı argümanı
// olarak ALINMAZ (shell geçmişine yazılmasın diye); gizli girişle sorulur.
//
//   node scripts/generate-admin-credentials.mjs
//
// Çıktıdaki ADMIN_PASSWORD_HASH ve SESSION_SECRET değerlerini .env.local ve
// Vercel Environment Variables'a yazın. Parolanın kendisi hiçbir yere yazılmaz.

import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";

const N = 16384, r = 8, p = 1, KEYLEN = 32;

// Tek readline arayüzü: iki soru arasında satır kaybolmasın (boru ile beslemede de çalışır).
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const lines = rl[Symbol.asyncIterator]();
let muted = false;
const originalWrite = rl._writeToOutput?.bind(rl);
if (originalWrite) rl._writeToOutput = (s) => { if (!muted) originalWrite(s); };

async function askHidden(question) {
  process.stdout.write(question);
  muted = true;
  const { value } = await lines.next();
  muted = false;
  process.stdout.write("\n");
  return value ?? "";
}

const password = await askHidden("Yeni admin parolası (en az 14 karakter): ");
const confirm = await askHidden("Parolayı tekrar girin: ");
rl.close();

if (password !== confirm) { console.error("Parolalar eşleşmiyor."); process.exit(1); }
if (password.length < 14) { console.error("Parola en az 14 karakter olmalı."); process.exit(1); }

const salt = randomBytes(16);
const hash = await new Promise((res, rej) =>
  scrypt(password, salt, KEYLEN, { N, r, p, maxmem: 128 * N * r * 2 }, (e, k) => (e ? rej(e) : res(k)))
);

console.log("\n# --- .env.local / Vercel Environment Variables ---");
console.log("ADMIN_EMAIL=<admin e-posta adresiniz>");
console.log(`ADMIN_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`);
console.log(`SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
console.log("\nEski NEXT_PUBLIC_ADMIN_EMAIL ve NEXT_PUBLIC_ADMIN_PASSWORD değişkenlerini silin.");
