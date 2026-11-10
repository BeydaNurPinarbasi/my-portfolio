import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/http/origin";
import nodemailer from "nodemailer";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { insertMessage } from "@/lib/db/messages";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-\s]{7,25}$/;

// Başlık enjeksiyonunu (CR/LF) ve kontrol karakterlerini temizler.
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  // Bellek içi sınır (tek süreç). Birden fazla replika için proxy düzeyinde limit gerekir (bkz. rate-limit.ts).
  const limit = rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Honeypot: gerçek kullanıcılar bu gizli alanı doldurmaz. Botu sessizce "başarılı" say.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ success: "E-posta başarıyla gönderildi!" }, { status: 200 });
  }

  const name = typeof body.name === "string" ? oneLine(body.name) : "";
  const email = typeof body.email === "string" ? oneLine(body.email) : "";
  const phone = typeof body.phone === "string" ? oneLine(body.phone) : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ error: "Lütfen tüm alanları doldurun." }, { status: 400 });
  }
  if (name.length > 100 || email.length > 254 || message.length > 5000) {
    return NextResponse.json({ error: "Alanlardan biri izin verilen uzunluğu aşıyor." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Geçerli bir telefon numarası girin." }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? oneLine(body.topic).slice(0, 100) : "";

  // 1) Önce veritabanına kaydet: e-posta başarısız olsa bile mesaj admin panelinde kalır.
  let saved = false;
  try {
    await insertMessage({ name, email, phone, topic, message });
    saved = true;
  } catch (error) {
    console.error("[contact] veritabanına kaydedilemedi:", error);
  }

  // 2) E-posta bildirimi. Ayarlar yoksa ya da gönderim başarısızsa ve kayıt yapılmışsa yine başarı say.
  let emailed = false;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[contact] EMAIL_USER / EMAIL_PASS tanımlı değil.");
  } else {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        // Varsayılan zaman aşımları dakikalarca sürebilir; SMTP'ye ulaşılamazsa hızlı hata ver.
        // VPS/Docker ortamlarında IPv6 yolu olmayınca smtp.gmail.com'a bağlantı sessizce takılır; IPv4'e zorla.
        ...({ family: 4 } as object), // @types/nodemailer 'family' alanını bilmiyor; çalışma zamanında geçerli
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: ["beydanurpinarbasi@veraporta.com", "beydanur.pinarbasi@gmail.com"], // bildirim iki adrese de gider
        replyTo: email,
        subject: `beyda.dev sitenden mesaj var - ${name}`,
        text: `Gönderen: ${name} (${email})\nTelefon: ${phone}${topic ? `\nKonu: ${topic}` : ""}\n\nMesaj:\n${message}`,
      });
      emailed = true;
    } catch (error) {
      console.error("E-posta gönderme hatası:", error);
    }
  }

  if (saved || emailed) {
    return NextResponse.json({ success: "Mesajınız alındı." }, { status: 200 });
  }
  return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
}
