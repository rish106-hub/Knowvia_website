"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppApiError, appFetch } from "@/lib/app-client";
import type { SessionView } from "@/lib/app-contract";
import { Button, ButtonLink, Field, Notice } from "../ui";
import { errorCopy, isSignInUnavailable } from "./error-copy";
import { asApiError, useApp } from "./session-context";

export type SignInReason = "expired" | "signed_out" | null;

type Failure = { kind: "unavailable" } | { kind: "error"; error: AppApiError };

export function SignInScreen({ reason }: { reason: SignInReason }) {
  const { state, signedIn } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const justSignedIn = useRef(false);

  // A signed-in visitor has no business here (unless we just signed them in and are already navigating on).
  useEffect(() => {
    if (state.status === "ready" && !justSignedIn.current) router.replace("/app");
  }, [state.status, router]);

  const expired = reason === "expired" || (state.status === "signed_out" && state.reason === "expired");
  const signedOut = !expired && (reason === "signed_out" || (state.status === "signed_out" && state.reason === "signed_out"));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter an email address, like name@example.com.");
      return;
    }
    setEmailError(null);
    setFailure(null);
    setBusy(true);
    try {
      const session = await appFetch<SessionView>("/session", {
        method: "POST",
        json: { provider: "dev", email: trimmed, ...(displayName.trim() ? { displayName: displayName.trim() } : {}) },
      });
      justSignedIn.current = true;
      signedIn(session);
      router.push("/app/documents");
    } catch (caught) {
      const error = asApiError(caught);
      if (isSignInUnavailable(error)) setFailure({ kind: "unavailable" });
      else if (error.code === "INVALID_REQUEST") setEmailError("That email address was not accepted. Check it and try again.");
      else setFailure({ kind: "error", error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="kva-stack">
        <h1 className="kva-h1">{expired ? "Your session ended" : signedOut ? "You have signed out" : "Sign in to Knowvia"}</h1>
        {expired ? (
          <Notice tone="warning" title="Getting back into the same household is not available yet" live="polite">
            A new development sign-in starts a new, empty household, so documents from your earlier session will not be there.
          </Notice>
        ) : null}
        {signedOut ? <p className="kva-lead">Your session is closed on this device.</p> : null}
      </div>

      {state.status === "loading" ? (
        <p className="kva-p kva-muted" role="status">
          Checking whether you are signed in.
        </p>
      ) : state.status === "error" ? (
        <Notice tone="error" title={errorCopy(state.error).title}>
          {errorCopy(state.error).message}
        </Notice>
      ) : failure?.kind === "unavailable" ? (
        <div className="kva-card" data-testid="sign-in-unavailable">
          <Notice tone="info" title="Sign-in is not available yet" live="polite">
            Knowvia accounts are not open yet. No code was sent, and nothing was saved.
          </Notice>
          <div>
            <ButtonLink href="/" variant="secondary" size="sm">
              Back to the Knowvia site
            </ButtonLink>
          </div>
        </div>
      ) : (
        <form className="kva-card" onSubmit={(event) => void onSubmit(event)} noValidate>
          <Notice tone="warning" title="Development sign-in" live="off">
            This sign-in does not check your email and does not send a code. Each sign-in creates a new household. Use sample documents only.
          </Notice>
          <Field label="Email" hint="Not verified. Nothing is sent to it." error={emailError}>
            {(control) => <input {...control} className="kva-input" type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
          </Field>
          <Field label="Your name (optional)">
            {(control) => <input {...control} className="kva-input" type="text" name="displayName" autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />}
          </Field>
          {failure?.kind === "error" ? (
            <Notice tone="error" title={errorCopy(failure.error).title}>
              {errorCopy(failure.error).message}
            </Notice>
          ) : null}
          <Button type="submit" block busy={busy}>
            Continue with development sign-in
          </Button>
        </form>
      )}
    </>
  );
}
