"use client";

// İletişim formu: mevcut /api/contact sözleşmesini olduğu gibi kullanır (Origin kontrolü, rate limit,
// honeypot, sunucu doğrulaması orada). Buradaki doğrulama yalnızca erken ve erişilebilir geri bildirim içindir.
//
// Form çalışmazsa (503/500/ağ hatası) yazılan mesaj kaybolmaz: aynı içerikle e-posta taslağı açılabilir.

import { useRef, useState, type FormEvent } from "react";
import { CONTACT_EMAIL, CONTACT_LIMITS, CONTACT_TOPICS, EMAIL_RE, PHONE_RE } from "@/content/contact";

type Field = "name" | "email" | "phone" | "message";
type Values = Record<Field, string>;
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; name: string }
  | { kind: "error"; message: string; fallback: boolean };

const EMPTY: Values = { name: "", email: "", phone: "", message: "" };

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (!v.name.trim()) e.name = "Adınızı yazın.";
  else if (v.name.length > CONTACT_LIMITS.name) e.name = `En fazla ${CONTACT_LIMITS.name} karakter.`;
  if (!v.email.trim()) e.email = "E-posta adresinizi yazın.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Geçerli bir e-posta adresi yazın (ör. ad@alan.com).";
  if (!v.phone.trim()) e.phone = "Telefon numaranızı yazın.";
  else if (!PHONE_RE.test(v.phone.trim())) e.phone = "Yalnızca rakam, boşluk ve + ( ) - kullanın.";
  if (!v.message.trim()) e.message = "Mesajınızı yazın.";
  else if (v.message.length > CONTACT_LIMITS.message) e.message = `En fazla ${CONTACT_LIMITS.message} karakter.`;
  return e;
}

export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [website, setWebsite] = useState(""); // honeypot: kullanıcıya görünmez
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const errors = validate(values);
  const show = (f: Field) => (touched[f] ? errors[f] : undefined);
  const set = (f: Field) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));

  // Konu, API'de ayrı alan olmadığı için mesajın başına eklenir.
  const fullMessage = () => `[${topic}]\n\n${values.message.trim()}`;
  const mailto = () =>
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`beyda.dev · ${topic}`)}&body=${encodeURIComponent(
      `${values.message.trim()}\n\n${values.name}\n${values.email}\n${values.phone}`
    )}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, message: true });
    if (Object.keys(errors).length) {
      // İlk hatalı alana odaklan: klavye ve ekran okuyucu kullanıcısı nerede olduğunu bilsin.
      const first = (["name", "email", "phone", "message"] as Field[]).find((f) => errors[f]);
      formRef.current?.querySelector<HTMLElement>(`#c-${first}`)?.focus();
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, message: fullMessage(), website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setStatus({ kind: "sent", name: values.name.trim() });
        setValues(EMPTY);
        setTouched({});
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      if (res.status === 429) {
        setStatus({ kind: "error", message: "Kısa sürede çok sayıda mesaj gönderildi. Biraz sonra tekrar deneyin ya da doğrudan e-posta gönderin.", fallback: true });
      } else if (res.status >= 500) {
        setStatus({ kind: "error", message: "Form şu an mesaj gönderemiyor. Yazdıklarınız kaybolmasın: aynı mesajı e-posta ile gönderebilirsiniz.", fallback: true });
      } else {
        setStatus({ kind: "error", message: data.error ?? "Mesaj gönderilemedi. Alanları kontrol edip tekrar deneyin.", fallback: false });
      }
    } catch {
      setStatus({ kind: "error", message: "Bağlantı kurulamadı. Yazdıklarınız kaybolmasın: aynı mesajı e-posta ile gönderebilirsiniz.", fallback: true });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="ct-done" role="status">
        <h3 ref={doneRef} tabIndex={-1} className="ab-h3">
          Mesajın ulaştı.
        </h3>
        <p className="st-p">Teşekkürler{status.name ? `, ${status.name}` : ""}. Mesajını okuyup e-posta ile dönüş yapacağım.</p>
        <button type="button" className="st-link ct-reset" onClick={() => setStatus({ kind: "idle" })}>
          Yeni mesaj yaz
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";
  const input = (f: Field, label: string, props: Record<string, unknown>) => {
    const err = show(f);
    return (
      <div className="ct-field" data-invalid={!!err}>
        <label htmlFor={`c-${f}`}>
          {label} <span aria-hidden="true">*</span>
        </label>
        <input
          id={`c-${f}`}
          name={f}
          value={values[f]}
          onChange={set(f)}
          onBlur={blur(f)}
          required
          aria-invalid={!!err}
          aria-describedby={err ? `c-${f}-err` : undefined}
          {...props}
        />
        {err && (
          <p id={`c-${f}-err`} className="ct-err">
            {err}
          </p>
        )}
      </div>
    );
  };

  const msgErr = show("message");
  return (
    <form ref={formRef} className="ct-form" onSubmit={onSubmit} noValidate aria-busy={sending}>
      {/* Honeypot: ekran dışında, erişilebilirlik ağacından gizli */}
      <div aria-hidden="true" className="ct-hp">
        <label htmlFor="c-website">Web sitesi</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <fieldset className="ct-topics">
        <legend>Konu</legend>
        {CONTACT_TOPICS.map((t) => (
          <label key={t} className="ct-chip">
            <input type="radio" name="topic" value={t} checked={topic === t} onChange={() => setTopic(t)} />
            <span>{t}</span>
          </label>
        ))}
      </fieldset>

      <div className="ct-row">
        {input("name", "Ad soyad", { type: "text", autoComplete: "name", maxLength: CONTACT_LIMITS.name })}
        {input("email", "E-posta", { type: "email", autoComplete: "email", inputMode: "email", maxLength: CONTACT_LIMITS.email })}
      </div>
      {input("phone", "Telefon", { type: "tel", autoComplete: "tel", inputMode: "tel" })}

      <div className="ct-field" data-invalid={!!msgErr}>
        <label htmlFor="c-message">
          Mesaj <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={6}
          value={values.message}
          onChange={set("message")}
          onBlur={blur("message")}
          required
          maxLength={CONTACT_LIMITS.message}
          aria-invalid={!!msgErr}
          aria-describedby={`c-message-count${msgErr ? " c-message-err" : ""}`}
          placeholder="Ne yapmak istediğinizi, neden önemli olduğunu ve beklentilerinizi kısaca anlatın."
        />
        <p id="c-message-count" className="ct-count">
          {values.message.length} / {CONTACT_LIMITS.message}
        </p>
        {msgErr && (
          <p id="c-message-err" className="ct-err">
            {msgErr}
          </p>
        )}
      </div>

      <div className="ct-submit">
        <button type="submit" className="st-btn" disabled={sending}>
          {sending ? "Gönderiliyor…" : "Gönder"}
        </button>
        <p className="ct-required">
          <span aria-hidden="true">*</span> Tüm alanlar zorunlu.
        </p>
      </div>

      {/* Durum mesajları ekran okuyucuya duyurulur. */}
      <div aria-live="polite" className="ct-live">
        {status.kind === "error" && (
          <div className="ct-alert" role="alert">
            <p>{status.message}</p>
            {status.fallback && (
              <a className="st-link" href={mailto()}>
                Mesajı e-posta ile gönder →
              </a>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
