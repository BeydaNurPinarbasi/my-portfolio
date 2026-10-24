import type { MetadataRoute } from "next";
import { PROFILE } from "@/content/profile";
import { postPath, ROUTES } from "@/content/routes";
import { listPublished } from "@/lib/blog/public";

// Yalnızca public sayfalar ve yayınlanmış yazılar. Admin, API ve /lab hiç listelenmez.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = PROFILE.url;
  const pages = [ROUTES.home, ROUTES.about, ROUTES.writing, ROUTES.contact].map((p) => ({ url: `${base}${p === "/" ? "" : p}` }));
  const posts = (await listPublished()).map((p) => ({ url: `${base}${postPath(p.slug)}`, lastModified: p.updatedAt }));
  return [...pages, ...posts];
}
