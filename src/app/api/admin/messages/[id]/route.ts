import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { deleteMessage, setMessageRead } from "@/lib/db/messages";

type Ctx = { params: Promise<{ id: string }> };
const validId = (id: string) => /^\d{1,18}$/.test(id);

// Okundu / okunmadı işaretle.
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req, { mutation: true });
  if (denied) return denied;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { isRead?: unknown } | null;
  if (typeof body?.isRead !== "boolean") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  try {
    const ok = await setMessageRead(id, body.isRead);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });
  } catch (err) {
    console.error("[messages] güncellenemedi:", err);
    return NextResponse.json({ error: "Güncellenemedi." }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req, { mutation: true });
  if (denied) return denied;
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });

  try {
    const ok = await deleteMessage(id);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });
  } catch (err) {
    console.error("[messages] silinemedi:", err);
    return NextResponse.json({ error: "Silinemedi." }, { status: 503 });
  }
}
