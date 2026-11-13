"use client";

import { Fragment, useEffect, useRef } from "react";
import type { Any } from "@/lib/dc";
import "./sb-story.css";

// Colour group per term, in the model's order (v.clauses). Colour only, no labels.
const CATS: Record<string, string> = {
  "Room rent limit": "cost", "Co-pay": "cost", "Sub-limit": "cost", "Deductible": "cost",
  "Waiting period": "time", "Pre-existing disease": "time", "Portability": "time",
  "Network hospital": "where", "Cashless claim": "where", "Day-care procedure": "where",
  "Restoration benefit": "extra", "No-claim bonus": "extra",
};

export function ClauseBand({ v }: { v: Any }) {
  const exRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = exRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver((es) => {
      if (es[0]?.isIntersecting) { el.classList.add("in"); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const cat = CATS[v.term.name] ?? "where";
  return (
    <section id="clauses" aria-labelledby="terms-h" className="sb-clauses">
      <div className="kv-hs" data-hs="">
        <div className="kv-hs-pin">
          <div className="kv-hs-track" data-hs-track="">
            <div className="kv-hs-intro">
              <p className="sb-eyebrow">{"The fine print"}</p>
              <p className="sb-h2 sb-mask">
                Six words decide <span className="mk">your bill.</span>
              </p>
              <p className="sb-lede">Each one, in plain words, with how a policy might word it. Keep scrolling.</p>
            </div>
            {(v.hsCards ?? []).map((hc: Any, i: number) => (
              <Fragment key={i}>
                <article className={`kv-hs-card sb-card c${i + 1}`}>
                  <p className="kv-hs-num sb-card-n"><span>{hc.n}{" / 06"}</span><span aria-hidden="true">{"→"}</span></p>
                  <h3 className="kv-hs-name">{hc.name}</h3>
                  <p className="kv-hs-def">{hc.def}</p>
                  <p className="kv-hs-quote">
                    <span>How a policy might word it</span>
                    {hc.ex}
                  </p>
                </article>
              </Fragment>
            ))}
          </div>
          <div style={{ padding: "0 var(--edge)" }}>
            <div className="kv-hs-bar" aria-hidden="true">
              <i data-hs-bar=""></i>
            </div>
          </div>
        </div>
      </div>

      <div className="sb-explore" ref={exRef}>
        <div className="sb-wrap">
          <div className="sb-head">
            <div className="sb-head-col">
              <p className="sb-eyebrow sb-rv">{"Built only for health cover"}</p>
              <h2 id="terms-h" className="sb-h2 sb-mask">{"Every clause that decides "}<span className="mk">{"your bill."}</span></h2>
            </div>
            <p className="sb-lede sb-rv">Twelve terms decide most claims. Tap one for plain words, the way Knowvia will explain it.</p>
          </div>
          <div className="sb-ex-grid">
            <div className="sb-exl">
              <ul className="sb-chips" aria-label="Health insurance terms Knowvia explains">
                {(v.clauses ?? []).map((t: Any, i: number) => (
                  <li key={i}>
                    <button
                      className="sb-chip"
                      type="button"
                      data-c={CATS[t.label] ?? "where"}
                      aria-pressed={t.pressed}
                      onClick={t.pick}
                      style={{ "--r": `${((i * 37) % 23) - 11}deg`, "--dl": `${i * 70}ms` } as React.CSSProperties}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sb-dict" data-c={cat} aria-live="polite">
              <div className="sb-dict-swap" key={v.term.name}>
                <p className="sb-eyebrow sb-dict-eyebrow">{"In plain words"}</p>
                <p className="sb-dict-name">{v.term.name}</p>
                <p className="sb-dict-def">{v.term.def}</p>
                <p className="sb-dict-ex"><span>How a policy might word it</span>{v.term.ex}</p>
              </div>
              <div className="sb-dict-nav">
                <button type="button" onClick={v.term.prev} aria-label="Previous term">{"←"}</button>
                <button type="button" onClick={v.term.next} aria-label="Next term">{"→"}</button>
                <span>{v.term.pos}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
