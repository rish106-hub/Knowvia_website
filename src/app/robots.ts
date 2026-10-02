import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!siteConfig.indexable) {
    // Preview and development deployments are never indexed.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/workspace", "/confirm", "/unsubscribe"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
