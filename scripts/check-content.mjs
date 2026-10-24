#!/usr/bin/env node
// İçerik kuralları denetimi (bkz. docs/story-architecture.md §6). Bağımlılık yok:
//   node scripts/check-content.mjs
// Otomatik denetlenemeyen kural: müşteri/marka adı. Onu yalnızca insan incelemesi yakalar.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const contentDir = join(root, "src/content");
const files = readdirSync(contentDir).filter((f) => f.endsWith(".ts"));
const read = (f) => readFileSync(join(contentDir, f), "utf8");
// Yorumları çıkar: kurallar yorumlarda örnek olarak geçebilir (ör. profile.ts).
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const errors = [];
const fail = (m) => errors.push(m);

const BANNED_TITLES = /\b(mühendis\w*|engineer\w*|architect\w*|mimar|lead|senior|kıdemli|team lead|cto|founder|kurucu)\b/i;
const NUMERIC_CLAIM = /\d+\s*\+|\b\d+\s*(yıl|yil|proje|müşteri|kullanıcı|years?|projects?|clients?|users?)\b|%\s*\d+|\d+\s*%/i;

for (const f of files) {
  const text = strip(read(f));
  for (const [i, line] of text.split("\n").entries()) {
    const strings = line.match(/"[^"]*"|`[^`]*`/g) ?? [];
    for (const s of strings) {
      if (BANNED_TITLES.test(s)) fail(`${f}:${i + 1} yasaklı unvan/ifade: ${s}`);
      // URL'ler sayısal kontrolden muaf: yüzde kodlaması (%9F) iddia değildir.
      if (!/^["`](https?:|mailto:)/.test(s) && NUMERIC_CLAIM.test(s)) fail(`${f}:${i + 1} sayısal iddia: ${s}`);
    }
  }
}

const profile = read("profile.ts");
if (!/title: "Yazılım Geliştirici"/.test(profile) || !/titleEn: "Software Developer"/.test(profile)) {
  fail("profile.ts: unvan yalnızca Yazılım Geliştirici / Software Developer olmalı");
}

// Her özellik ana sayfada ve Hakkımda'da gerçek bir bölüme bağlanmalı.
const home = read("home.ts");
const about = read("about.ts");
const traits = [...read("traits.ts").matchAll(/id: "(\w+)".*?tense: "(\w+)".*?homeSection: "(\w+)".*?aboutSection: "(\w+)"/g)];
if (traits.length !== 6) fail(`traits.ts: 6 özellik bekleniyordu, ${traits.length} bulundu`);
const sectionText = (src, id) => {
  const start = src.indexOf(`id: "${id}"`);
  if (start < 0) return null;
  const next = src.indexOf("\n  {", start);
  return src.slice(start, next < 0 ? undefined : next);
};
const GOAL = /(istiyorum|hedefliyorum|hedefler|hedefim)/;
for (const [, id, tense, homeId, aboutId] of traits) {
  const h = sectionText(home, homeId);
  const a = sectionText(about, aboutId);
  if (!h) fail(`traits.ts: ${id} -> home bölümü yok: ${homeId}`);
  if (!a) fail(`traits.ts: ${id} -> about bölümü yok: ${aboutId}`);
  // Hedefler başarı gibi yazılmasın: bağlı bölümlerde hedef dili bulunmalı.
  if (tense === "goal") {
    if (h && !GOAL.test(h)) fail(`home.ts/${homeId}: "${id}" bir hedef; metin hedef diliyle yazılmalı`);
    if (a && !GOAL.test(a)) fail(`about.ts/${aboutId}: "${id}" bir hedef; metin hedef diliyle yazılmalı`);
  }
}

// Çalışmalar: izin doğrulanmadan public olmamalı.
const work = strip(read("work.ts"));
for (const m of work.matchAll(/permission: "(\w[\w-]*)"[\s\S]*?status: "(\w+)"/g)) {
  if (m[2] === "published" && !["verified", "own-demo"].includes(m[1])) fail(`work.ts: izinsiz yayınlanmış çalışma (${m[1]})`);
}

// Yerel yasaklı ad listesi (müşteri, marka, gizli proje adları). Dosya .gitignore'da: adlar repoya
// hiç girmez. Satır başına bir ad; büyük/küçük harf duyarsız. Blog verisi de taranır, çünkü
// yönetim panelinden girilen yazılar içerik modelinden geçmez.
let denylist = [];
try {
  denylist = readFileSync(join(root, ".content-denylist"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
} catch {
  /* liste yoksa bu adım atlanır */
}
if (denylist.length) {
  const dataDir = join(root, "data");
  const targets = [
    ...files.map((f) => [`src/content/${f}`, read(f)]),
    ...readdirSync(dataDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => [`data/${f}`, readFileSync(join(dataDir, f), "utf8")]),
  ];
  for (const [name, text] of targets) {
    const lower = text.toLocaleLowerCase("tr");
    // Adın kendisi çıktıya yazılmaz (CI günlüklerinde de görünmesin); yalnızca sıra numarası.
    denylist.forEach((term, i) => {
      if (lower.includes(term.toLocaleLowerCase("tr"))) fail(`${name}: yasaklı ad listesindeki #${i + 1} bulundu`);
    });
  }
}

if (errors.length) {
  console.error(`İçerik denetimi BAŞARISIZ (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`İçerik denetimi geçti: ${files.length} dosya, ${traits.length} özellik${denylist.length ? `, ${denylist.length} yasaklı ad` : ", yasaklı ad listesi yok (.content-denylist)"}.`);
