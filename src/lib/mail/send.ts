// İletişim bildirimi gönderimi. İki yol:
//  1) RESEND_API_KEY varsa Resend (HTTPS/443): VPS'lerde engellenmez. Önerilen yol.
//  2) Yoksa Gmail SMTP (EMAIL_USER / EMAIL_PASS). Birçok hosting giden SMTP portlarını kapatır (ETIMEDOUT).
// Hata fırlatır; çağıran taraf yakalayıp kayda yazar. Hata metinleri sır içermez.

import nodemailer from "nodemailer";

export interface Mail {
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
}

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || (process.env.EMAIL_USER && process.env.EMAIL_PASS));
}

async function viaResend(mail: Mail) {
  // Alan adı Resend'de doğrulanana kadar yalnızca "onboarding@resend.dev" kullanılabilir
  // (o durumda yalnızca Resend hesabının e-postasına gönderilir).
  const from = process.env.CONTACT_FROM?.trim() || "beyda.dev <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: mail.to, reply_to: mail.replyTo, subject: mail.subject, text: mail.text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Resend ${res.status}: ${body.message ?? "gönderilemedi"}`);
  }
}

async function viaSmtp(mail: Mail) {
  // Önce 587 (STARTTLS), bağlanılamazsa 465 (SSL). Hetzner gibi sağlayıcılar 25 ve 465'i varsayılan
  // olarak engeller, 587'ye dokunmaz; engelli portta her mesajda zaman aşımını beklememek için 587 önce.
  const attempts = [
    { port: 587, secure: false },
    { port: 465, secure: true },
  ];
  let lastError: unknown;
  for (const a of attempts) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        ...a,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        // VPS/Docker'da IPv6 yolu olmayınca bağlantı takılır; IPv4'e zorla. Zaman aşımları hızlı hata içindir.
        ...({ family: 4 } as object), // @types/nodemailer 'family' alanını bilmiyor; çalışma zamanında geçerli
        connectionTimeout: 8_000,
        greetingTimeout: 8_000,
        socketTimeout: 12_000,
      });
      await transporter.sendMail({ from: process.env.EMAIL_USER, ...mail });
      return;
    } catch (err) {
      lastError = err;
      const code = (err as { code?: string }).code;
      // Yalnızca bağlantı sorunlarında diğer portu dene; kimlik doğrulama hatasında dur.
      if (code !== "ETIMEDOUT" && code !== "ECONNECTION" && code !== "ESOCKET" && code !== "ECONNREFUSED") break;
    }
  }
  const e = lastError as { code?: string; message?: string };
  throw new Error(`SMTP (587 ve 465) ${e.code ?? ""} ${e.message ?? ""}`.trim());
}

export async function sendMail(mail: Mail) {
  if (process.env.RESEND_API_KEY) return viaResend(mail);
  return viaSmtp(mail);
}
