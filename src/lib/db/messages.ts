import { ensureSchema, getPool } from "./index";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  /** null: bildirim denenmedi/bilinmiyor (eski kayıt) */
  emailSent: boolean | null;
  emailError: string | null;
}

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  email_sent: boolean | null;
  email_error: string | null;
}

const toMessage = (r: Row): ContactMessage => ({
  id: String(r.id),
  name: r.name,
  email: r.email,
  phone: r.phone,
  topic: r.topic,
  message: r.message,
  isRead: r.is_read,
  createdAt: r.created_at.toISOString(),
  emailSent: r.email_sent,
  emailError: r.email_error,
});

export async function insertMessage(
  m: Pick<ContactMessage, "name" | "email" | "phone" | "topic" | "message">
): Promise<string> {
  await ensureSchema();
  const r = await getPool().query<{ id: string }>(
    "INSERT INTO contact_messages (name, email, phone, topic, message) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [m.name, m.email, m.phone, m.topic, m.message]
  );
  return String(r.rows[0].id);
}

/** E-posta bildiriminin sonucunu kaydeder (hata nedeni admin panelinde görünür). */
export async function setEmailStatus(id: string, sent: boolean, error?: string) {
  await getPool().query("UPDATE contact_messages SET email_sent = $2, email_error = $3 WHERE id = $1", [
    id,
    sent,
    sent ? null : (error ?? "bilinmeyen hata").slice(0, 300),
  ]);
}

export async function listMessages(limit = 500): Promise<{ messages: ContactMessage[]; unread: number }> {
  await ensureSchema();
  const pool = getPool();
  const [rows, unread] = await Promise.all([
    pool.query<Row>("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1", [limit]),
    pool.query<{ n: string }>("SELECT count(*) AS n FROM contact_messages WHERE NOT is_read"),
  ]);
  return { messages: rows.rows.map(toMessage), unread: Number(unread.rows[0].n) };
}

export async function setMessageRead(id: string, isRead: boolean): Promise<boolean> {
  await ensureSchema();
  const r = await getPool().query("UPDATE contact_messages SET is_read = $2 WHERE id = $1", [id, isRead]);
  return (r.rowCount ?? 0) > 0;
}

export async function deleteMessage(id: string): Promise<boolean> {
  await ensureSchema();
  const r = await getPool().query("DELETE FROM contact_messages WHERE id = $1", [id]);
  return (r.rowCount ?? 0) > 0;
}
