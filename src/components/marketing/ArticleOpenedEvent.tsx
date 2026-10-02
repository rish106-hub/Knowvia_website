"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

export function ArticleOpenedEvent({ slug }: { slug: string }) {
  useEffect(() => {
    track("article_opened", { slug });
  }, [slug]);
  return null;
}
