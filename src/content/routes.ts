// Sitenin iç bağlantıları tek yerde (gezinme, içerik bağlantıları, sitemap, JSON-LD).
export const ROUTES = {
  home: "/",
  about: "/about",
  writing: "/blog",
  contact: "/contact",
} as const;

export const postPath = (slug: string) => `${ROUTES.writing}/${slug}`;
