"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type UnsubscribeState = "ready" | "working" | "done" | "invalid" | "error";

export function UnsubscribeForm() {
  const params = useSearchParams();
  const lead = params.get("lead");
  const sig = params.get("sig");
  const [state, setState] = useState<UnsubscribeState>(lead && sig ? "ready" : "invalid");

  async function unsubscribe() {
    setState("working");
    try {
      const query = new URLSearchParams({ lead: lead ?? "", sig: sig ?? "" });
      const response = await fetch(`/api/public/v1/leads/unsubscribe?${query}`, {
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        setState("done");
        window.history.replaceState(null, "", "/unsubscribe");
      } else {
        setState(response.status === 400 ? "invalid" : "error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="form-status" data-tone="success" role="status">
        Done. You will not receive any more Knowvia emails, and your details have been erased.
      </p>
    );
  }
  if (state === "invalid") {
    return (
      <p className="form-status" data-tone="error" role="alert">
        This link is incomplete. Use the link at the bottom of any Knowvia email, or contact us from the privacy notice.
      </p>
    );
  }
  return (
    <div className="stack">
      <p className="lede">This stops every Knowvia email and erases your sign-up details.</p>
      <button type="button" className="button" onClick={unsubscribe} disabled={state === "working"}>
        {state === "working" ? "Stopping…" : "Stop all emails"}
      </button>
      {state === "error" ? (
        <p className="form-status" data-tone="error" role="alert">
          We could not complete this right now. Try again in a few minutes.
        </p>
      ) : null}
    </div>
  );
}
