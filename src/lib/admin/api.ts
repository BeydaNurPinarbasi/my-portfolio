// Admin ekranlarının API istemcisi. Oturum bilgisi istemcide tutulmaz;
// sunucu 401 dönerse (cookie yok/süresi dolmuş) giriş sayfasına yönlendirilir.
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { credentials: "same-origin", ...init });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.assign("/admin/login");
  }
  return res;
}
