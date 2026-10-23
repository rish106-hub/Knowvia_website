// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { Fragment } from "react";
import { type Any, css, truthy } from "@/lib/dc";

export function HeroSection({ v }: { v: Any }) {
  return (
    <>
    <div className="kv-loader" aria-hidden="true">
      <svg width="60" height="60" viewBox="0 0 800 800">
        <rect width="800" height="800" rx="144" fill="#0F4A3A"></rect>
        <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
        <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
        <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
      </svg>
      <b>
        <span>
          {"K"}
        </span>
        <span>
          {"n"}
        </span>
        <span>
          {"o"}
        </span>
        <span>
          {"w"}
        </span>
        <span>
          {"v"}
        </span>
        <span>
          {"i"}
        </span>
        <span>
          {"a"}
        </span>
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
            <p className="kv-eyebrow" style={{color: "#A8DCCB"}}>
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
          <div className="kv-dock-card">
            <p style={{margin: "0", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", height: "30px", padding: "0 12px", borderRadius: "999px", background: "#C8E6A0", fontSize: "14px", fontWeight: "700", color: "#0F4A3A"}}>
              <span className="kv-pdot" aria-hidden="true"></span>
              {"Opening soon"}
            </p>
            {" "}
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(28px,3vw,40px)", lineHeight: "1.08", letterSpacing: "-0.01em", color: "#FFFFFF", maxWidth: "12ch"}}>
              {"Know your cover. Before you need it."}
            </p>
            {" "}
            <p style={{margin: "0", fontSize: "16px", lineHeight: "1.5", color: "#C9DDD9"}}>
              {"One email the day Knowvia opens. Nothing before."}
            </p>
            {" "}
            <a className="kv-lime" href="#early-list" onClick={v.dock.close} style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", height: "48px", padding: "0 22px", borderRadius: "999px", background: "#C8E6A0", color: "#0F4A3A", fontSize: "16px", fontWeight: "700", textDecoration: "none"}}>
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
            <rect width="800" height="800" rx="144" fill="#163F42"></rect>
            <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
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
    <section id="top" className="kv-bleed kv-hero" aria-labelledby="hero-h">
      <div className="kv-L">
        <p style={{margin: "0", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", height: "34px", padding: "0 14px", borderRadius: "999px", background: "#C8E6A0", fontSize: "15px", fontWeight: "700", color: "#0F4A3A"}}>
          <span className="kv-pdot" aria-hidden="true"></span>
          {"Opening soon · early list is open"}
        </p>
        {" "}
        <h1 id="hero-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(44px,5vw,76px)", lineHeight: "1.02", letterSpacing: "-0.02em", color: "#163F42", maxWidth: "12ch", textWrap: "balance"}}>
          <span style={{backgroundImage: "linear-gradient(#C8E6A0,#C8E6A0)", backgroundRepeat: "no-repeat", backgroundPosition: "0 86%", backgroundSize: "100% 0.26em", animation: "kvMark 800ms cubic-bezier(0.165,0.84,0.44,1) 1400ms both"}}>
            {"Ask your health policy."}
          </span>
          {" Get a straight answer."}
        </h1>
        {" "}
        <p style={{margin: "0", fontSize: "clamp(18px,1.45vw,21px)", lineHeight: "1.5", maxWidth: "36ch", color: "#55696D"}}>
          {"Plain words. The exact page. And when the policy is unclear, we say so instead of guessing."}
        </p>
        {" "}
        <div id="hero-form" style={{maxWidth: "540px"}}>
          {truthy(v.hero.showForm) && (
            <>
            <form onSubmit={v.hero.submit} noValidate style={{display: "flex", flexDirection: "column", gap: "8px"}}>
              <label htmlFor="hero-email" style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#1A3034"}}>
                {"Email"}
              </label>
              <div style={{display: "flex", flexWrap: "wrap", gap: "12px"}}>
                <input id="hero-email" name="email" type="email" autoComplete="email" onChange={v.hero.setEmail} aria-invalid={v.hero.invalid} aria-describedby="hero-error hero-help" style={css(v.hero.inputStyle)} />
                <button className="kv-btn" type="submit" aria-disabled={v.hero.busyStr} style={{flex: "0 0 auto", height: "56px", padding: "0 30px", border: "0", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", font: "inherit", fontSize: "17px", fontWeight: "600", letterSpacing: "0.005em", whiteSpace: "nowrap", cursor: "pointer"}}>
                  {v.hero.buttonLabel}
                </button>
              </div>
              {truthy(v.hero.busy) && (
                <>
                <div aria-hidden="true" style={{height: "3px", borderRadius: "3px", background: "linear-gradient(90deg,#E6EFEC,#176F69,#E6EFEC)", backgroundSize: "200% 100%", animation: "kvLoad 1.2s linear infinite"}}></div>
                </>
              )}
              <p id="hero-error" role="alert" style={{margin: "0", color: "#A74335", fontSize: "17px", lineHeight: "1.45", fontWeight: "600"}}>
                {v.hero.error}
              </p>
              <p id="hero-help" style={{margin: "0", fontSize: "16px", lineHeight: "1.5", color: "#55696D"}}>
                {"Knowvia is not open yet. One email the day it is. Nothing before."}
              </p>
            </form>
            </>
          )}
          {" "}
          {truthy(v.hero.showSuccess) && (
            <>
            <div role="status" style={{borderLeft: "4px solid #C8E6A0", padding: "6px 0 6px 18px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) both", display: "flex", flexDirection: "column", gap: "8px"}}>
              <p style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                {"You are on the list."}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
                {"We will email "}{v.hero.emailShown}{" when Knowvia opens. While you wait, find your policy schedule and your employer's benefits booklet."}
              </p>
            </div>
            </>
          )}
        </div>
        {" "}
        <div className="kv-backers">
          <span style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
            {"Supported by"}
          </span>
          {" "}
          <img src="/logos/lightspeed.png" alt="Lightspeed" style={{height: "26px", width: "auto", display: "block"}} />
          {" "}
          <span aria-hidden="true" style={{width: "1px", height: "28px", background: "#CFDCDA"}}></span>
          {" "}
          <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" style={{height: "32px", width: "auto", display: "block"}} />
        </div>
      </div>
      {" "}
      <div className="kv-R" role="group" aria-label="Example: ask a sample family policy a question">
        <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{right: "-260px", bottom: "-300px", width: "820px", height: "820px", opacity: "0.1"}}>
          <path d="M258 194v412M265 404l274 210M265 404l274-210" fill="none" stroke="#A8DCCB" strokeWidth="40" strokeLinecap="round"></path>
          <circle cx="400" cy="400" r="290" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
          <circle cx="400" cy="400" r="240" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
          <circle cx="400" cy="400" r="190" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        </svg>
        {" "}
        <div style={{position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", maxWidth: "600px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.16)"}}>
          <div>
            <p style={{margin: "0", fontSize: "17px", fontWeight: "700"}}>
              {"Family floater · Maa and you"}
            </p>
            <p style={{margin: "0", fontSize: "14px", color: "#A8DCCB"}}>
              {"A sample policy, not yours"}
            </p>
          </div>
          <span className="kv-badge" style={{background: "#C8E6A0", color: "#0F4A3A"}}>
            {"Preview"}
          </span>
        </div>
        {" "}
        <form className="kv-search" role="search" onSubmit={v.ask.submit}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55696D" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{flex: "0 0 auto"}}>
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M20 20l-3.5-3.5"></path>
          </svg>
          {" "}
          <label htmlFor="ask-input" className="kv-sr">
            {"Ask the sample policy a question"}
          </label>
          {" "}
          <input id="ask-input" name="question" type="text" autoComplete="off" placeholder="Ask anything about this policy" onChange={v.ask.setText} />
          {" "}
          <button type="submit">
            {"Ask"}
          </button>
        </form>
        {" "}
        <div className="kv-chips" role="group" aria-label="Popular questions" style={{position: "relative"}}>
          {(v.ask.chips ?? []).map((c: Any, i4: number) => (
            <Fragment key={i4}>
              <button className="kv-q" type="button" aria-pressed={c.pressed} onClick={c.pick}>
                {c.q}
                <span aria-hidden="true" className={c.timerCls}></span>
              </button>
            </Fragment>
          ))}
        </div>
        {" "}
        <div className="kv-chat" aria-live="polite" style={{position: "relative"}}>
          <div className="kv-me">
            {v.ask.q}
          </div>
          {" "}
          {truthy(v.ask.typing) && (
            <>
            <div className="kv-typing" aria-label="Knowvia is reading">
              <i></i>
              <i></i>
              <i></i>
            </div>
            </>
          )}
          {" "}
          {truthy(v.ask.ready) && (
            <>
            <div className="kv-ans">
              <span className={v.ask.badgeCls}>
                {v.ask.badge}
              </span>
              {" "}
              <p style={{margin: "0", fontSize: "16px", lineHeight: "1.5"}}>
                {v.ask.a}
              </p>
              {" "}
              <div className="kv-cite">
                <b style={{fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#176F69"}}>
                  {v.ask.c}
                </b>
                <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontStyle: "italic", fontSize: "16px", color: "#163F42"}}>
                  {v.ask.t}
                </span>
              </div>
            </div>
            </>
          )}
        </div>
        {" "}
        <div style={{position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", fontSize: "14px", color: "#A8DCCB"}}>
          <span>
            {v.ask.status}
          </span>
          <button type="button" onClick={v.ask.toggle} style={{background: "none", border: "0", padding: "6px 0", font: "inherit", fontSize: "14px", fontWeight: "600", color: "#C8E6A0", cursor: "pointer"}}>
            {v.ask.toggleLabel}
          </button>
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
