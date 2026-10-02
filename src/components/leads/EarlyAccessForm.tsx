"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { track } from "@/lib/analytics/client";
import { LEAD_NOTICE_VERSION } from "@/lib/leads/notice";

type Audience = "individual" | "hr" | "other";
type Intent = "launch_updates" | "newsletter" | "policy_clarity";
type Placement = "hero" | "guide" | "article" | "footer";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SUBMIT_TIMEOUT_MS = 15_000;
const TOKEN_WAIT_MS = 8_000;

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string; retryable: boolean };

let turnstileScript: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      turnstileScript = null;
      reject(new Error("turnstile_unavailable"));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

const fieldMessages: Record<string, string> = {
  email: "Enter a valid email address, like name@example.com.",
  marketingConsent: "Tick the box to agree to early-access emails.",
  ageConfirmed: "Early access is open to people aged 18 or older.",
  name: "Use letters, numbers and simple punctuation in your name.",
  role: "Use letters, numbers and simple punctuation in your role.",
  organisation: "Use letters, numbers and simple punctuation in the organisation name.",
};

interface EarlyAccessFormProps {
  placement: Placement;
  defaultAudience?: Audience;
  heading?: string;
}

export function EarlyAccessForm({ placement, defaultAudience = "individual", heading = "Join early access" }: EarlyAccessFormProps) {
  const pathname = usePathname();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>(defaultAudience);
  const [intent, setIntent] = useState<Intent>("launch_updates");
  const tokenRef = useRef<string | null>(null);
  const tokenWaiters = useRef<Array<(token: string) => void>>([]);
  const setTurnstileToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    if (token) {
      tokenWaiters.current.forEach((resolve) => resolve(token));
      tokenWaiters.current = [];
    }
  }, []);
  // The invisible check may still be running when the person presses Send; wait briefly for it.
  const waitForToken = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        if (tokenRef.current) return resolve(tokenRef.current);
        const timer = setTimeout(() => resolve(null), TOKEN_WAIT_MS);
        tokenWaiters.current.push((token) => {
          clearTimeout(timer);
          resolve(token);
        });
      }),
    [],
  );
  const [turnstileError, setTurnstileError] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !turnstileSiteKey || state.kind === "done") return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !widgetRef.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(widgetRef.current, {
          sitekey: turnstileSiteKey,
          action: "early_access",
          appearance: "interaction-only",
          callback: (token: string) => {
            setTurnstileToken(token);
            setTurnstileError(false);
          },
          "expired-callback": () => setTurnstileToken(null),
          "error-callback": () => setTurnstileError(true),
        });
      })
      .catch(() => setTurnstileError(true));
    return () => {
      cancelled = true;
    };
  }, [open, state.kind, setTurnstileToken]);

  useEffect(() => {
    if (open) emailRef.current?.focus();
  }, [open]);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [setTurnstileToken]);

  const onFieldChange = () => {
    // Edited content is a different request; a new idempotency key avoids a conflict.
    idempotencyKey.current = null;
    if (fieldErrors.length) setFieldErrors([]);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "submitting") return;
    const data = new FormData(event.currentTarget);
    const localErrors = [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email") ?? "").trim()) ? null : "email",
      data.get("marketingConsent") === "on" ? null : "marketingConsent",
      data.get("ageConfirmed") === "on" ? null : "ageConfirmed",
    ].filter((value): value is string => value !== null);
    if (localErrors.length) {
      setFieldErrors(localErrors);
      setState({ kind: "error", message: "Check the highlighted fields and try again.", retryable: false });
      return;
    }
    setState({ kind: "submitting" });
    const token = await waitForToken();
    if (!token) {
      setState({ kind: "error", message: "The security check has not finished. Reload the page and try again.", retryable: true });
      return;
    }
    const optional = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value ? value : undefined;
    };
    const utmSource = new URLSearchParams(window.location.search).get("utm_source");
    const payload = {
      email: String(data.get("email") ?? ""),
      audience,
      intent,
      noticeVersion: LEAD_NOTICE_VERSION,
      marketingConsent: data.get("marketingConsent") === "on",
      ageConfirmed: data.get("ageConfirmed") === "on",
      turnstileToken: token,
      name: optional("name"),
      role: optional("role"),
      organisation: optional("organisation"),
      source: {
        page: pathname,
        placement,
        ...(utmSource && /^[A-Za-z0-9._-]{1,64}$/.test(utmSource) ? { utmSource } : {}),
      },
    };
    idempotencyKey.current ??= crypto.randomUUID();
    setFieldErrors([]);

    try {
      const response = await fetch("/api/public/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; fields?: string[] };
      if (response.status === 202) {
        setState({ kind: "done" });
        idempotencyKey.current = null;
        const leadAudience = audience;
        track("lead_form_submitted", { placement, audience: leadAudience, intent });
        return;
      }
      resetTurnstile();
      if (response.status === 400 && result.error === "invalid_request") {
        setFieldErrors(result.fields ?? []);
        idempotencyKey.current = null;
        setState({ kind: "error", message: "Check the highlighted fields and try again.", retryable: false });
      } else if (result.error === "verification_failed") {
        setState({ kind: "error", message: "We could not verify this browser. Try again.", retryable: true });
      } else if (response.status === 429) {
        setState({ kind: "error", message: "Too many attempts from this connection. Try again in 10 minutes.", retryable: false });
      } else {
        setState({ kind: "error", message: "Sign-up is unavailable right now. Try again in a few minutes.", retryable: true });
      }
    } catch {
      resetTurnstile();
      setState({
        kind: "error",
        message: "We could not reach Knowvia. Check your connection and try again.",
        retryable: true,
      });
    }
  }

  useEffect(() => {
    if (state.kind === "error" || state.kind === "done") statusRef.current?.focus();
  }, [state.kind]);

  if (!open) {
    return (
      <div className="early-access-closed">
        <button
          type="button"
          className="button"
          onClick={() => {
            setOpen(true);
            track("lead_form_started", { placement });
          }}
        >
          {heading}
        </button>
        <p className="small muted">Email only. No policy details or health questions.</p>
      </div>
    );
  }

  if (state.kind === "done") {
    return (
      <div className="form-status" data-tone="success" role="status" tabIndex={-1} ref={statusRef}>
        <p>
          <strong>Check your inbox.</strong>
        </p>
        <p>
          We sent a confirmation link. Early-access emails start only after you confirm. If nothing arrives in a few
          minutes, check your spam folder.
        </p>
      </div>
    );
  }

  const hasError = (field: string) => fieldErrors.includes(field);
  const signupUnavailable = !turnstileSiteKey;

  return (
    <form className="early-access-form stack" noValidate onSubmit={onSubmit} onChange={onFieldChange} aria-labelledby={`${ids}-title`}>
      <p id={`${ids}-title`} className="form-title">
        {heading}
      </p>
      {signupUnavailable ? (
        <p className="form-status" data-tone="error">
          Early-access sign-up is not open on this deployment yet.
        </p>
      ) : null}
      <div className="field">
        <label htmlFor={`${ids}-email`}>Email</label>
        <input
          ref={emailRef}
          id={`${ids}-email`}
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          aria-invalid={hasError("email")}
          aria-describedby={hasError("email") ? `${ids}-email-error` : undefined}
        />
        {hasError("email") ? (
          <p id={`${ids}-email-error`} className="field-error">
            {fieldMessages.email}
          </p>
        ) : null}
      </div>

      <fieldset className="field">
        <legend>I am asking for</legend>
        <div className="choice-row">
          {(
            [
              ["individual", "My family"],
              ["hr", "My team (HR)"],
              ["other", "Something else"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="choice-chip">
              <input type="radio" name="audience" value={value} checked={audience === value} onChange={() => setAudience(value)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={`${ids}-intent`}>What would you like?</label>
        <select
          id={`${ids}-intent`}
          className="select"
          value={intent}
          onChange={(event) => setIntent(event.target.value as Intent)}
        >
          <option value="launch_updates">Tell me when early access opens</option>
          <option value="newsletter">Send me new guides (about once a month)</option>
          <option value="policy_clarity">I want help understanding my cover</option>
        </select>
      </div>

      <details className="optional-fields">
        <summary>Add your name, role and organisation (optional)</summary>
        <div className="stack" style={{ "--stack-space": "0.85rem" } as React.CSSProperties}>
          {(
            [
              ["name", "Name", "name", 80],
              ["role", "Role", "organization-title", 80],
              ["organisation", "Organisation", "organization", 120],
            ] as const
          ).map(([name, label, autoComplete, max]) => (
            <div className="field" key={name}>
              <label htmlFor={`${ids}-${name}`}>{label}</label>
              <input
                id={`${ids}-${name}`}
                name={name}
                className="input"
                autoComplete={autoComplete}
                maxLength={max}
                aria-invalid={hasError(name)}
              />
              {hasError(name) ? <p className="field-error">{fieldMessages[name]}</p> : null}
            </div>
          ))}
        </div>
      </details>

      <label className="check">
        <input type="checkbox" name="marketingConsent" required aria-invalid={hasError("marketingConsent")} />
        <span>
          Email me about Knowvia early access. I can stop at any time. I have read the{" "}
          <Link href="/privacy">privacy notice</Link>.
        </span>
      </label>
      {hasError("marketingConsent") ? <p className="field-error">{fieldMessages.marketingConsent}</p> : null}
      <label className="check">
        <input type="checkbox" name="ageConfirmed" required aria-invalid={hasError("ageConfirmed")} />
        <span>I am 18 or older.</span>
      </label>
      {hasError("ageConfirmed") ? <p className="field-error">{fieldMessages.ageConfirmed}</p> : null}

      <div ref={widgetRef} className="turnstile-slot" />
      {turnstileError ? (
        <p className="field-error">The security check did not load. Reload the page or try another browser.</p>
      ) : null}

      <div className="button-row">
        <button type="submit" className="button" disabled={state.kind === "submitting" || signupUnavailable}>
          {state.kind === "submitting" ? "Sending…" : "Send confirmation link"}
        </button>
      </div>

      {state.kind === "error" ? (
        <div className="form-status" data-tone="error" role="alert" tabIndex={-1} ref={statusRef}>
          {state.message}
        </div>
      ) : null}
      <p className="small muted">We send one email to confirm. Nothing is shared with insurers or employers.</p>
    </form>
  );
}
