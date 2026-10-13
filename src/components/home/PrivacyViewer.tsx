"use client";

import { useState } from "react";

export function PrivacyViewer() {
  const [viewer, setViewer] = useState<"you" | "brother">("brother");
  return <div className="privacy-card">
    <span className="eyebrow dark">Example</span>
    <div className="viewer-switch" role="group" aria-label="Seen by">
      <span>Seen by</span>
      <button type="button" className={viewer === "you" ? "active" : ""} onClick={() => setViewer("you")}>You</button>
      <button type="button" className={viewer === "brother" ? "active" : ""} onClick={() => setViewer("brother")}>Your brother</button>
    </div>
    <h3>{viewer === "you" ? "What you see" : "What your brother sees"}</h3>
    <p>{viewer === "you" ? "Your full record, including details you keep private." : "Only what you chose to share."}</p>
    <dl>
      <div><dt>Cover amount</dt><dd>₹5,00,000 floater</dd></div>
      <div><dt>Policy details</dt><dd>Policy number, TPA, hospital desk contact</dd></div>
      <div><dt>Medical details</dt><dd>{viewer === "you" ? "Visible only to you" : "Not shared"}</dd></div>
    </dl>
  </div>;
}
