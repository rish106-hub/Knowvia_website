"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function WaitlistForm({ location, detailed = false }: { location: "hero" | "closing"; detailed?: boolean }) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("submitting");
    setMessage("");
    const data = Object.fromEntries(new FormData(form));
    const query = new URLSearchParams(window.location.search);
    const attribution = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].map((key) => [key, query.get(key) ?? ""]));

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, ...attribution, location }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Something went wrong. Please try again.");
      setStatus("success");
      setMessage("You’re on the early list. We will email you when Knowvia opens.");
      form.reset();
      window.dispatchEvent(new CustomEvent("knowvia:lead"));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") return <div className="form-success" role="status"><strong>You’re on the list.</strong><span>{message}</span></div>;

  return (
    <form className={`waitlist-form ${detailed ? "waitlist-detailed" : ""}`} onSubmit={submit} noValidate>
      <label htmlFor={`${location}-email`}>Email</label>
      <div className="form-row">
        <input id={`${location}-email`} name="email" type="email" autoComplete="email" required placeholder="you@example.com" aria-describedby={`${location}-message`} />
        <input className="honeypot" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {!detailed && <button className="button" disabled={status === "submitting"}>{status === "submitting" ? "Joining…" : "Join the early list"}</button>}
      </div>
      {detailed && (
        <fieldset>
          <legend>What is coming up for your family? <span>(optional)</span></legend>
          <p>We use this only to decide what Knowvia reads first for you.</p>
          <div className="choice-grid">
            {["A renewal", "Planned treatment", "A job change", "Parents’ cover", "Nothing yet, just getting organised"].map((choice) => <label className="choice" key={choice}><input type="checkbox" name="events" value={choice} />{choice}</label>)}
          </div>
          <button className="button button-light" disabled={status === "submitting"}>{status === "submitting" ? "Joining…" : "Join the early list"}</button>
        </fieldset>
      )}
      <p id={`${location}-message`} className={`form-message ${status === "error" ? "is-error" : ""}`} role={status === "error" ? "alert" : undefined}>{message || (detailed ? "Not an insurer. Not selling your data. One email when we open." : "Knowvia is not open yet. We will email you the day it is.")}</p>
    </form>
  );
}
