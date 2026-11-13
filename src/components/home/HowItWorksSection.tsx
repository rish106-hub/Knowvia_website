"use client";

import type { Any } from "@/lib/dc";
import "./sb-story.css";

export function HowItWorksSection({ v }: { v: Any }) {
  return (
    <section id="how" aria-labelledby="how-h" className="sb-how">
      <div className="sb-wrap sb-how-body">
        <div className="sb-head center">
          <p className="sb-eyebrow sb-rv">
            {"Watch it work · 15 seconds"}
          </p>
          <h2 id="how-h" className="sb-h2 sb-mask">
            {"See three answers for "}<span className="mk">{"every person."}</span>
          </h2>
          <p className="sb-lede sb-rv" style={{ "--d": "120ms" } as React.CSSProperties}>
            {"Add the health policies you already have. It reads them person by person, and shows its working."}
          </p>
        </div>
      </div>

      <div className="sb-expand sb-how-video sb-rv" data-sb-progress="">
        <video
          controls
          muted
          playsInline
          preload="metadata"
          poster="/demo/knowvia-walkthrough-poster.png"
          aria-label="Walkthrough of Knowvia: add a policy, give consent, ask a question and see the page that answers it."
        >
          <source src="/demo/knowvia-walkthrough.webm" type="video/webm" />
          Your browser cannot play this video.
        </video>
      </div>

      <div className="sb-wrap">
        <ol className="sb-steps">
          {(v.film.chaps ?? []).map((ch: Any, i: number) => (
            <li key={i} className="sb-step sb-rv" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <span className="sb-step-n" aria-hidden="true">{ch.n}</span>
              <h3>{ch.title}</h3>
              <p>{ch.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
