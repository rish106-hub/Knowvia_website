"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import "./sb-mid.css";

const PARTS: { t: string; mk?: boolean }[] = [
  { t: "I can't say ‘an app told me.’ I can say ‘it says here, " },
  { t: "page fourteen", mk: true },
  { t: ".’" },
];

/** Split the quote into word spans; words in the highlighted phrase sit inside one marked span. */
function words(text: string, key: string) {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((tok, i) => (/^\s+$/.test(tok) ? tok : <span key={`${key}${i}`} className="sb-w">{tok}</span>));
}

export function FamilyQuote() {
  const quoteRef = useRef<HTMLQuoteElement>(null);

  // Words light up one by one as the quote scrolls through the viewport. Without the effect (or with
  // reduced motion) every word stays fully lit.
  useEffect(() => {
    const bq = quoteRef.current;
    if (!bq || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ws = Array.from(bq.querySelectorAll<HTMLElement>(".sb-w"));
    bq.classList.add("sb-q-anim");
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      const r = bq.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.5)));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle("lit", i < n));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      bq.classList.remove("sb-q-anim");
    };
  }, []);

  return (
    <section className="sb-quote" aria-labelledby="quote-h">
      <div className="sb-quote-l">
        <p className="sb-eyebrow sb-rv">
          {"In their words"}
        </p>
        <h2 id="quote-h" className="sb-h2 sb-mask" style={{maxWidth: "14ch"}}>
          {"Why every answer comes with "}<span className="mk">{"a page."}</span>
        </h2>
        <p className="sb-lede sb-rv" style={{"--d": "120ms", maxWidth: "38ch"} as CSSProperties}>
          {"M. checked a top-up quote against her base policy before paying for it. Her point: at the hospital desk, only the document counts."}
        </p>
      </div>
      <div className="sb-quote-r on-dark">
        <span className="sb-quote-mark" aria-hidden="true">
          {"“"}
        </span>
        <figure className="sb-quote-tx">
          <blockquote ref={quoteRef}>
            {PARTS.map((p, i) =>
              p.mk ? (
                <span key={i} className="sb-quote-hl">{words(p.t, `m${i}`)}</span>
              ) : (
                <span key={i}>{words(p.t, `p${i}`)}</span>
              ),
            )}
          </blockquote>
          <figcaption className="sb-quote-who">
            <span className="sb-quote-av" aria-hidden="true">
              {"M"}
            </span>
            <span>
              {"M., 29, Bengaluru"}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
