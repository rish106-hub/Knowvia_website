import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "./site";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const index = siteConfig.indexable && !input.noindex;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: !input.noindex },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: input.type ?? "website",
      ...(input.type === "article" ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description },
  };
}

/** Serialises structured data safely inside a script tag (no closing-tag or HTML injection). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/brand/knowvia-mark.svg"),
    description: siteConfig.description,
    ...(siteConfig.privacyEmail
      ? { contactPoint: { "@type": "ContactPoint", contactType: "privacy", email: siteConfig.privacyEmail } }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
