// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import "./sb-hero.css";
import { type Any, truthy } from "@/lib/dc";

export function HeroSection({ v }: { v: Any }) {
  const panel = useRef<HTMLDivElement>(null);
  const par = useRef<HTMLDivElement>(null);
  // subtle cursor parallax on the photo, fine pointers only
  useEffect(() => {
    const el = panel.current, layer = par.current;
    if (!el || !layer) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      layer.style.setProperty("--px", -x * 14 + "px");
      layer.style.setProperty("--py", -y * 14 + "px");
    };
    const leave = () => { layer.style.setProperty("--px", "0px"); layer.style.setProperty("--py", "0px"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  return (
    <>
    <div className="kv-loader" aria-hidden="true">
      <svg width="60" height="60" viewBox="0 0 800 800">
        <rect width="800" height="800" rx="144" fill="#13281f"></rect>
        <path d="M258 194v412M265 404l274 210" fill="none" stroke="#E8EEE6" strokeWidth="58" strokeLinecap="round"></path>
        <path d="M265 404l274-210" fill="none" stroke="#F4C542" strokeWidth="58" strokeLinecap="round"></path>
        <path d="M557 150l46 46-46 46-46-46z" fill="#F4C542"></path>
      </svg>
      <b>
        {"Knowvia".split("").map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </b>
    </div>
    <div className="kv-progress" aria-hidden="true"></div>
    <nav className="kv-rail" aria-label="Sections" data-show={v.rail.show}>
      {(v.rail.items ?? []).map((ri: Any, i1: number) => (
        <Fragment key={i1}>
          <a href={ri.href} aria-current={ri.cur}>
            <i></i>
            <span>
              {ri.label}
            </span>
          </a>
        </Fragment>
      ))}
    </nav>
    <button className="kv-dock-scrim" type="button" tabIndex={-1} aria-hidden="true" data-open={v.dock.openStr} onClick={v.dock.close}></button>
    <div className="kv-dock" data-open={v.dock.openStr} data-away={v.dock.awayStr}>
      <div id="dock-panel" className="kv-dock-panel">
        <div className="kv-dock-grid" data-lenis-prevent="">
          <div>
            <p className="sb-dock-title">
              {"Explore Knowvia"}
            </p>
            {" "}
            <ol className="kv-dock-list">
              {(v.dock.items ?? []).map((di: Any, i2: number) => (
                <Fragment key={i2}>
                  <li>
                    <a href={di.href} onClick={v.dock.close}>
                      <span>
                        {di.n}
                      </span>
                      {di.label}
                    </a>
                  </li>
                </Fragment>
              ))}
            </ol>
          </div>
          {" "}
          <div className="kv-dock-card sb-dock-card">
            <p className="sb-dock-h">
              {"Know your cover. Before you need it."}
            </p>
            <p className="sb-dock-p">
              {"One email the day Knowvia opens. Nothing before."}
            </p>
            <a className="sb-btn" href="#early-list" onClick={v.dock.close}>
              {"Join the early list"}
            </a>
          </div>
        </div>
        {" "}
        <div className="kv-dock-tick" aria-hidden="true">
          <ul>
            {(v.ticker ?? []).map((dt: Any, i3: number) => (
              <Fragment key={i3}>
                <li>
                  {dt}
                </li>
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
      {" "}
      <nav className="kv-dock-bar" aria-label="Quick links">
        <a className="kv-dock-home" href="#top" aria-label="Knowvia, back to the top">
          <svg width="30" height="30" viewBox="0 0 800 800" aria-hidden="true">
            <rect width="800" height="800" rx="144" fill="#13281f"></rect>
            <path d="M258 194v412M265 404l274 210" fill="none" stroke="#E8EEE6" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M265 404l274-210" fill="none" stroke="#F4C542" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M557 150l46 46-46 46-46-46z" fill="#F4C542"></path>
          </svg>
        </a>
        {" "}
        <a className="kv-dock-link" href="#how">
          {"How it works"}
        </a>
        {" "}
        <a className="kv-dock-link" href="#try">
          {"Room test"}
        </a>
        {" "}
        <a className="kv-dock-link" href="#questions">
          {"Questions"}
        </a>
        {" "}
        <button className="kv-dock-x" type="button" onClick={v.dock.toggle} aria-expanded={v.dock.openStr} aria-controls="dock-panel">
          {v.dock.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 15l6-6 6 6"></path>
          </svg>
        </button>
        {" "}
        <a className="kv-dock-join" href="#early-list" onClick={v.dock.close}>
          {"Join"}
        </a>
      </nav>
    </div>
    <section id="top" className="sb-hero" aria-labelledby="hero-h">
      <div className="sb-hero-l">
        <span className="sb-blob" aria-hidden="true"></span>
        <h1 id="hero-h">
          <span className="sb-ln"><span><span className="mk">{"Ask your health policy."}</span></span></span>
          <span className="sb-ln"><span>{"Get a straight answer."}</span></span>
        </h1>
        <p className="sb-lede sb-fade" style={{"--d": "450ms"} as CSSProperties}>
          {"Plain words. The exact page. And when the policy is unclear, we say so instead of guessing."}
        </p>
        <div id="hero-form" className="sb-fade" style={{"--d": "600ms"} as CSSProperties}>
          {truthy(v.hero.showForm) && (
            <>
            <form className="sb-hero-form" onSubmit={v.hero.submit} noValidate>
              <label htmlFor="hero-email">
                {"Email"}
              </label>
              <div className="sb-hero-row">
                <input id="hero-email" className="sb-input" name="email" type="email" autoComplete="email" placeholder="you@work.com" onChange={v.hero.setEmail} aria-invalid={v.hero.invalid} aria-describedby="hero-error hero-help" />
                <button className="sb-btn" type="submit" aria-disabled={v.hero.busyStr}>
                  {v.hero.buttonLabel}
                </button>
              </div>
              {truthy(v.hero.busy) && (
                <>
                <div className="sb-hero-bar" aria-hidden="true"></div>
                </>
              )}
              <p id="hero-error" className="sb-hero-err" role="alert">
                {v.hero.error}
              </p>
              <p id="hero-help" className="sb-hero-help">
                {"One email the day Knowvia opens. Nothing before."}
              </p>
            </form>
            </>
          )}
          {" "}
          {truthy(v.hero.showSuccess) && (
            <>
            <div className="sb-hero-ok" role="status">
              <b>
                {"You are on the list."}
              </b>
              <p>
                {"We will email "}{v.hero.emailShown}{" with your Knowvia access. While you wait, find your policy schedule and your employer's benefits booklet."}
              </p>
              <a className="sb-btn dk" href={v.hero.betaUrl}>
                {"Try the beta now"}
              </a>
            </div>
            </>
          )}
        </div>
        {" "}
        <div className="sb-backers sb-fade" style={{"--d": "750ms"} as CSSProperties}>
          <span>
            {"Supported by"}
          </span>
          {" "}
          <img src="/logos/lightspeed.png" alt="Lightspeed" width={832} height={164} />
          {" "}
          <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" width={840} height={192} />
        </div>
      </div>
      {" "}
      <div className="sb-hero-r" ref={panel} role="group" aria-label="Ask a family policy a question">
        <div className="sb-hero-par" ref={par}>
          <img className="sb-hero-photo" src="/landing/family-hero.jpg" width={1100} height={1375} alt="A young Indian couple laughing with their toddler outdoors" fetchPriority="high" />
        </div>
        <div className="sb-ask">
          <div className="sb-ask-head">
            <div>
              <p className="sb-ask-pol">
                {"Family floater · Maa and you"}
              </p>
              <p className="sb-ask-since">
                {"Policy started March 2024"}
              </p>
            </div>
            <span className="kv-badge sb-ask-members">
              {"2 members"}
            </span>
          </div>
          <div aria-live="polite">
          <div className="sb-ask-q">
            {v.ask.q}
          </div>
          <div className="sb-ask-a">
            {truthy(v.ask.typing) && (
              <>
              <div className="kv-typing" aria-label="Knowvia is reading">
                <i></i>
                <i></i>
                <i></i>
              </div>
              </>
            )}
            {truthy(v.ask.ready) && (
              <>
              <span className={v.ask.badgeCls}>
                {v.ask.badge}
              </span>
              <p>
                {v.ask.a}
              </p>
              <div className="sb-cite">
                <b>
                  {v.ask.c}
                </b>
                <span>
                  {v.ask.t}
                </span>
              </div>
              </>
            )}
          </div>
          </div>
          <div className="sb-ask-chips" role="group" aria-label="Popular questions">
            {(v.ask.chips ?? []).map((c: Any, i4: number) => (
              <Fragment key={i4}>
                <button className="kv-q" type="button" aria-pressed={c.pressed} onClick={c.pick}>
                  {c.q}
                  <span aria-hidden="true" className={c.timerCls}></span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="sb-ask-foot">
            <form className="sb-ask-form" role="search" onSubmit={v.ask.submit}>
              <label htmlFor="ask-input" className="kv-sr">
                {"Ask this policy a question"}
              </label>
              <input id="ask-input" name="question" type="text" autoComplete="off" placeholder="Ask anything about this policy" onChange={v.ask.setText} />
              <button type="submit">
                {"Ask"}
              </button>
            </form>
          </div>
          <div className="sb-ask-status-row">
            <span className="sb-ask-status">
              {v.ask.status}
            </span>
            <button className="sb-ask-play" type="button" onClick={v.ask.toggle}>
              {v.ask.toggleLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
    <div className="kv-ticker" aria-hidden="true">
      <ul>
        {(v.ticker ?? []).map((tk: Any, i5: number) => (
          <Fragment key={i5}>
            <li>
              {tk}
            </li>
          </Fragment>
        ))}
      </ul>
    </div>
    </>
  );
}
