"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const googleId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
const googleConversion = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function loadScript(source: string, id: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = source;
  document.head.appendChild(script);
}

export function ConsentAnalytics() {
  const [consent, setConsent] = useState<"unknown" | "accepted" | "declined">("unknown");

  useEffect(() => {
    const saved = localStorage.getItem("knowvia-analytics-consent");
    if (saved === "accepted" || saved === "declined") {
      const task = window.setTimeout(() => setConsent(saved), 0);
      return () => window.clearTimeout(task);
    }
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return;
    if (googleId) {
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${googleId}`, "knowvia-google-tag");
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
      window.gtag("js", new Date());
      window.gtag("config", googleId, { anonymize_ip: true });
    }
    if (metaPixelId) {
      const fbq = ((...args: unknown[]) => {
        const queue = (fbq as unknown as { queue?: unknown[] }).queue || [];
        queue.push(args);
        (fbq as unknown as { queue: unknown[] }).queue = queue;
      }) as typeof window.fbq;
      window.fbq = fbq;
      loadScript("https://connect.facebook.net/en_US/fbevents.js", "knowvia-meta-pixel");
      window.fbq?.("init", metaPixelId);
      window.fbq?.("track", "PageView");
    }
    const onLead = () => {
      window.gtag?.("event", "generate_lead", googleConversion ? { send_to: googleConversion } : {});
      window.fbq?.("track", "Lead");
    };
    window.addEventListener("knowvia:lead", onLead);
    return () => window.removeEventListener("knowvia:lead", onLead);
  }, [consent]);

  function choose(next: "accepted" | "declined") {
    localStorage.setItem("knowvia-analytics-consent", next);
    setConsent(next);
  }

  if (consent !== "unknown" || (!googleId && !metaPixelId)) return null;
  return <aside className="consent-banner" aria-label="Analytics choice">
    <p><strong>Your choice.</strong> Optional analytics help us understand which pages work. Advertising tools stay off unless you allow them.</p>
    <div><button className="button button-small" onClick={() => choose("accepted")}>Allow analytics</button><button className="text-button" onClick={() => choose("declined")}>No thanks</button></div>
  </aside>;
}
