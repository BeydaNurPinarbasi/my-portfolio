import type { MetadataRoute } from "next";
import { PROFILE } from "@/content/profile";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/lab"] }],
    sitemap: `${PROFILE.url}/sitemap.xml`,
  };
}
