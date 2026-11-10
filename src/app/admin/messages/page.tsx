"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Mail, Phone, RotateCcw, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/api";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  emailSent: boolean | null;
  emailError: string | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mesajlar yüklenemedi.");
      setMessages(data.messages);
      setUnread(data.unread);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mesajlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRead = async (m: Message) => {
    const res = await adminFetch(`/api/admin/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: !m.isRead }),
    });
    if (res.ok) load();
  };

  const remove = async (m: Message) => {
    if (!confirm(`${m.name} adlı kişinin mesajı silinsin mi? Bu işlem geri alınamaz.`)) return;
    const res = await adminFetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mesajlar</h1>
        <p className="text-muted-foreground mt-2">İletişim formunu dolduranlar{unread > 0 ? ` · ${unread} okunmamış` : ""}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gelen mesajlar</CardTitle>
          <CardDescription>En yeni en üstte</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Yükleniyor...</p>
          ) : error ? (
            <p className="text-center py-12 text-red-600">{error}</p>
          ) : messages.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Henüz mesaj yok.</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => (
                <li key={m.id} className={`rounded-lg border border-border p-4 ${m.isRead ? "" : "bg-accent/40 border-l-4 border-l-purple-500"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {m.name}
                        {m.topic && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal">{m.topic}</span>}
                      </p>
                      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:underline">
                          <Mail className="h-3.5 w-3.5" /> {m.email}
                        </a>
                        <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {m.phone}
                        </a>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                      {m.emailSent === false && (
                        <p className="text-xs text-red-600">E-posta bildirimi gitmedi: {m.emailError || "neden bilinmiyor"}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title={m.isRead ? "Okunmadı yap" : "Okundu yap"} onClick={() => toggleRead(m)}>
                        {m.isRead ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Sil" className="text-red-600" onClick={() => remove(m)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-foreground">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
