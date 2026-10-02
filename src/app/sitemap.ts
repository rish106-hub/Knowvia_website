import type { MetadataRoute } from "next";
import { articles } from "@/content/articles";
import { absoluteUrl } from "@/lib/site";

const staticRoutes = ["/", "/for-families", "/for-employers", "/how-it-works", "/blog", "/about", "/trust", "/privacy", "/terms", "/cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((path) => ({ url: absoluteUrl(path) })),
    ...articles.map((article) => ({ url: absoluteUrl(`/blog/${article.slug}`), lastModified: article.updatedAt })),
  ];
}
