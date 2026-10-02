"use client";

import type { PostHog } from "posthog-js";
import { googleConsentSignals, type ConsentChoice } from "@/lib/consent/consent";
import {
  isSensitivePath,
  pathOnly,
  validateAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventProps,
} from "./events";

// Browser analytics adapter. Nothing here loads or sends until the matching consent is granted.

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
const googleLeadConversion = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION;

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let consent: ConsentChoice = { analytics: false, advertising: false };
let posthog: PostHog | null = null;
let posthogLoading: Promise<void> | null = null;
let googleLoaded = false;
// Events raised before the stored consent is read wait here; they are dropped if there is no prior choice.
let consentResolved = false;
let pending: Array<() => void> = [];

const URL_PROPERTIES = ["$current_url", "$referrer", "$initial_referrer", "$initial_current_url"] as const;

async function loadPosthog(): Promise<void> {
  if (!posthogKey || !posthogHost || posthog) return;
  posthogLoading ??= import("posthog-js").then(({ default: client }) => {
    client.init(posthogKey, {
      api_host: posthogHost,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_exceptions: false,
      capture_performance: false,
      rageclick: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      mask_personal_data_properties: true,
      person_profiles: "never",
      opt_out_capturing_by_default: true,
      save_referrer: false,
      persistence: "localStorage+cookie",
      before_send: (event) => {
        if (!event) return null;
        for (const key of URL_PROPERTIES) {
          if (key in event.properties) event.properties[key] = pathOnly(event.properties[key] as string);
        }
        return event;
      },
    });
    posthog = client;
  });
  await posthogLoading;
}

function loadGoogle(): void {
  if (!googleTagId || googleLoaded) return;
  googleLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  // Basic Consent Mode: defaults are set before the tag loads, and the tag loads only after a grant.
  window.gtag("consent", "default", { ...googleConsentSignals({ analytics: false, advertising: false }) });
  window.gtag("consent", "update", googleConsentSignals(consent));
  window.gtag("js", new Date());
  window.gtag("config", googleTagId, { send_page_view: false, allow_google_signals: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`;
  document.head.appendChild(script);
}

/** Called when no consent choice is stored yet: nothing raised so far may be sent. */
export function markConsentUndecided(): void {
  consentResolved = true;
  pending = [];
}

export async function applyConsent(next: ConsentChoice): Promise<void> {
  consent = { ...next };
  if (consent.analytics) {
    await loadPosthog();
    // Consent may have been withdrawn while the SDK was loading.
    if (consent.analytics) posthog?.opt_in_capturing({ captureEventName: false });
  } else if (posthog) {
    // reset() returns PostHog to its default (opted-in) state, so opt out afterwards.
    posthog.reset();
    posthog.opt_out_capturing();
  }
  if (consent.advertising) {
    loadGoogle();
  } else if (googleLoaded && window.gtag) {
    window.gtag("consent", "update", googleConsentSignals(consent));
  }
  const queued = pending;
  pending = [];
  consentResolved = true;
  queued.forEach((send) => send());
}

export function track<Name extends AnalyticsEventName>(name: Name, props: AnalyticsEventProps<Name>): void {
  if (typeof window === "undefined") return;
  const pathname = window.location.pathname;
  if (isSensitivePath(pathname) && name !== "newsletter_verified") return;
  const valid = validateAnalyticsEvent(name, props);
  if (!valid) return;
  if (!consentResolved) {
    if (pending.length < 20) pending.push(() => track(name, props));
    return;
  }
  if (consent.analytics && posthog) {
    posthog.capture(name, { ...valid, $current_url: isSensitivePath(pathname) ? undefined : pathname });
  }
  if (name === "lead_form_submitted" && consent.advertising && googleLoaded && window.gtag && googleLeadConversion) {
    window.gtag("event", "conversion", { send_to: googleLeadConversion });
  }
}
