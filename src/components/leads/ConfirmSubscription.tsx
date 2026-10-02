"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics/client";

type ConfirmState = "ready" | "working" | "confirmed" | "invalid" | "error";

// Confirmation needs a click: link scanners in mail systems fetch URLs, but do not press buttons.
export function ConfirmSubscription() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<ConfirmState>(token ? "ready" : "invalid");

  async function confirm() {
    setState("working");
    try {
      const response = await fetch("/api/public/v1/leads/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        setState("confirmed");
        track("newsletter_verified", {});
        window.history.replaceState(null, "", "/confirm");
      } else {
        setState(response.status === 400 ? "invalid" : "error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "confirmed") {
    return (
      <div className="form-status" data-tone="success" role="status">
        <p>
          <strong>You are on the list.</strong> We will email you when there is news. Every email has a link to stop.
        </p>
        <p>
          <Link href="/blog">Read the guides</Link> while you wait.
        </p>
      </div>
    );
  }
  if (state === "invalid") {
    return (
      <div className="form-status" data-tone="error" role="alert">
        <p>
          This link has expired or was already used. If you confirmed before, nothing more is needed. Otherwise,{" "}
          <Link href="/#early-access">sign up again</Link> for a new link.
        </p>
      </div>
    );
  }
  return (
    <div className="stack">
      <p className="lede">Press the button to start receiving Knowvia early-access emails.</p>
      <button type="button" className="button" onClick={confirm} disabled={state === "working"}>
        {state === "working" ? "Confirming…" : "Confirm my email"}
      </button>
      {state === "error" ? (
        <p className="form-status" data-tone="error" role="alert">
          We could not confirm right now. Try again in a few minutes.
        </p>
      ) : null}
    </div>
  );
}
