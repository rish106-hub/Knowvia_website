// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { Fragment } from "react";
import Link from "next/link";
import { type Any, css, truthy } from "@/lib/dc";

export function EarlyListSection({ v }: { v: Any }) {
  return (
    <>
    <section id="early-list" className="kv-bleed kv-close" aria-labelledby="close-h">
      <div className="kv-L">
        <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{left: "-260px", bottom: "-300px", width: "760px", height: "760px", opacity: "0.1"}}>
          <circle cx="400" cy="400" r="290" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
          <circle cx="400" cy="400" r="240" fill="none" stroke="#C8E6A0" strokeWidth="3"></circle>
          <path d="M258 194v412M265 404l274 210" fill="none" stroke="#C9DDD9" strokeWidth="34" strokeLinecap="round"></path>
          <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="34" strokeLinecap="round"></path>
        </svg>
        {" "}
        <h2 id="close-h" className="kv-h2 kv-reveal" style={{position: "relative", margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(42px,5vw,76px)", lineHeight: "1.02", letterSpacing: "-0.02em", color: "#FFFFFF", maxWidth: "11ch"}}>
          {"Know your cover. "}
          <span style={{color: "#C8E6A0"}}>
            {"Before you need it."}
          </span>
        </h2>
        {" "}
        <p style={{position: "relative", margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55", color: "#C9DDD9", maxWidth: "38ch"}}>
          {"Only your email is required. Tell us which policies your family has, and Knowvia reads those first for you."}
        </p>
        {" "}
        <ul style={{position: "relative", listStyle: "none", margin: "8px 0 0", padding: "0", display: "flex", flexDirection: "column", gap: "12px"}}>
          <li style={{display: "flex", gap: "12px", alignItems: "center", fontSize: "17px", color: "#FFFFFF"}}>
            <span aria-hidden="true" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(200,230,160,0.16)"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C8E6A0" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
            </span>
            {"Not an insurer, and not selling you one."}
          </li>
          <li style={{display: "flex", gap: "12px", alignItems: "center", fontSize: "17px", color: "#FFFFFF"}}>
            <span aria-hidden="true" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(200,230,160,0.16)"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C8E6A0" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
            </span>
            {"Your answers are never sold or shared."}
          </li>
          <li style={{display: "flex", gap: "12px", alignItems: "center", fontSize: "17px", color: "#FFFFFF"}}>
            <span aria-hidden="true" style={{flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(200,230,160,0.16)"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C8E6A0" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
            </span>
            {"One email when we open. Nothing before."}
          </li>
        </ul>
      </div>
      {" "}
      <div className="kv-R">
        <div style={{maxWidth: "560px"}}>
          {truthy(v.close.showForm) && (
            <>
            <form onSubmit={v.close.submit} noValidate style={{display: "flex", flexDirection: "column", gap: "20px"}}>
              {truthy(v.cm.showTabs) && (
                <>
                <div role="group" aria-label="How do you want to tell us?" style={{display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "#E6EFEC"}}>
                  <button type="button" onClick={v.cm.setWrite} aria-pressed={v.cm.isWriteStr} style={css(v.cm.writeStyle)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20h4L19 9l-4-4L4 16z"></path>
                      <path d="M13 7l4 4"></path>
                    </svg>
                    {"Write it"}
                  </button>
                  <button type="button" onClick={v.cm.setVoice} aria-pressed={v.cm.isVoiceStr} style={css(v.cm.voiceStyle)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3"></rect>
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>
                    </svg>
                    {"Say it"}
                  </button>
                </div>
                </>
              )}
              <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <label htmlFor="close-email" style={{display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: "700", letterSpacing: "0.01em", color: "#0F4A3A"}}>
                  {"Email "}
                  <span style={{display: "inline-flex", alignItems: "center", height: "22px", padding: "0 8px", borderRadius: "6px", background: "#FFFFFF", color: "#163F42", fontSize: "13px", fontWeight: "700"}}>
                    {"Required"}
                  </span>
                </label>
                <input id="close-email" name="email" type="email" autoComplete="email" required onChange={v.close.setEmail} aria-invalid={v.close.invalid} aria-describedby="close-error close-consent" style={css(v.cm.emailStyle)} />
                <p id="close-error" role="alert" style={{margin: "0", color: "#A74335", fontSize: "16px", lineHeight: "1.45", fontWeight: "600"}}>
                  {v.close.error}
                </p>
              </div>
              {truthy(v.cm.isWrite) && (
                <>
                <div style={{display: "flex", flexDirection: "column", gap: "8px", animation: "kvIn 320ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                  <span id="pol-label" style={{fontSize: "15px", fontWeight: "700", letterSpacing: "0.01em", color: "#0F4A3A"}}>
                    {"Which health policies does your family have?"}
                  </span>
                  <button type="button" onClick={v.ms.toggle} aria-expanded={v.ms.openStr} aria-controls="pol-list" aria-labelledby="pol-label pol-value" style={css(v.ms.buttonStyle)}>
                    <span id="pol-value" style={css(v.ms.valueStyle)}>
                      {v.ms.summary}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={css(v.ms.chevronStyle)}>
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </button>
                  <div id="pol-list">
                    {truthy(v.ms.open) && (
                      <>
                      <div role="group" aria-labelledby="pol-label" style={{display: "flex", flexDirection: "column", padding: "6px", borderRadius: "12px", border: "1px solid #7B918E", background: "#FFFFFF", boxShadow: "0 12px 30px rgba(22,62,54,0.10)", animation: "kvIn 200ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                        {(v.policies ?? []).map((pc: Any, i1: number) => (
                          <Fragment key={i1}>
                            <button className="kv-opt" type="button" onClick={pc.toggle} aria-pressed={pc.on} style={css(pc.style)}>
                              <span aria-hidden="true" style={css(pc.boxStyle)}>
                                {truthy(pc.isOn) && (
                                  <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="5 12.5 10 17 19 7"></polyline>
                                  </svg>
                                  </>
                                )}
                              </span>
                              <span>
                                {pc.label}
                              </span>
                            </button>
                          </Fragment>
                        ))}
                        <button type="button" onClick={v.ms.toggle} style={{alignSelf: "flex-end", minHeight: "44px", padding: "0 16px", border: "0", background: "transparent", font: "inherit", fontSize: "16px", fontWeight: "600", color: "#176F69", cursor: "pointer"}}>
                          {"Done"}
                        </button>
                      </div>
                      </>
                    )}
                  </div>
                  <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#2E6B4A"}}>
                    {"Choose any. We use this only to decide what Knowvia reads first for you."}
                  </p>
                </div>
                </>
              )}
              {truthy(v.cm.isVoice) && (
                <>
                <div style={{display: "flex", flexDirection: "column", gap: "14px", animation: "kvIn 320ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                  <div style={{display: "flex", flexDirection: "column", gap: "14px", padding: "18px", borderRadius: "16px", background: "#FFFFFF", border: "1px solid #CFDCDA"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
                      {truthy(v.vn.isIdle) && (
                        <>
                        <button type="button" onClick={v.vn.start} aria-disabled={v.vn.lockedStr} aria-label="Start recording a voice note" style={css(v.vn.micStyle)}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="3" width="6" height="11" rx="3"></rect>
                            <path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>
                          </svg>
                        </button>
                        </>
                      )}
                      {truthy(v.vn.isRec) && (
                        <>
                        <button className="kv-rec" type="button" onClick={v.vn.stop} aria-label="Stop recording" style={{position: "relative", flex: "0 0 auto", width: "60px", height: "60px", borderRadius: "50%", border: "0", background: "#176F69", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"></rect>
                          </svg>
                        </button>
                        </>
                      )}
                      {truthy(v.vn.isDone) && (
                        <>
                        <button type="button" onClick={v.vn.play} aria-label={v.vn.playLabel} style={{flex: "0 0 auto", width: "60px", height: "60px", borderRadius: "50%", border: "2px solid #176F69", background: "#FFFFFF", color: "#176F69", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
                          {truthy(v.vn.playing) && (
                            <>
                            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"></rect>
                              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"></rect>
                            </svg>
                            </>
                          )}
                          {truthy(v.vn.paused) && (
                            <>
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M8 5.5v13l11-6.5z" fill="currentColor"></path>
                            </svg>
                            </>
                          )}
                        </button>
                        </>
                      )}
                      <div style={{flex: "1 1 auto", minWidth: "0", display: "flex", flexDirection: "column", gap: "8px"}}>
                        <div aria-hidden="true" style={{display: "flex", alignItems: "center", gap: "3px", height: "36px"}}>
                          {(v.vn.bars ?? []).map((b: Any, i2: number) => (
                            <Fragment key={i2}>
                              <span style={css(b.style)}></span>
                            </Fragment>
                          ))}
                        </div>
                        <p aria-live="polite" style={{margin: "0", display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "15px", color: "#55696D", fontVariantNumeric: "tabular-nums"}}>
                          <span style={{fontWeight: "600", color: "#163F42"}}>
                            {v.vn.status}
                          </span>
                          <span>
                            {v.vn.time}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p style={{margin: "0", fontSize: "16px", lineHeight: "1.5", color: "#1A3034"}}>
                      {"Up to 60 seconds. Tell us which policies your family has and what is on your mind. Speak in English or Hindi."}
                    </p>
                    {truthy(v.vn.isDone) && (
                      <>
                      <button type="button" onClick={v.vn.redo} style={{alignSelf: "flex-start", minHeight: "44px", padding: "0", border: "0", background: "transparent", font: "inherit", fontSize: "16px", fontWeight: "600", color: "#176F69", textDecoration: "underline", textUnderlineOffset: "4px", cursor: "pointer"}}>
                        {"Record again"}
                      </button>
                      </>
                    )}
                  </div>
                  <label style={{display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "16px", lineHeight: "1.5", color: "#1A3034", cursor: "pointer"}}>
                    {truthy(v.vn.consentOn) && (
                      <>
                      <input type="checkbox" defaultChecked onChange={v.vn.toggleConsent} style={{flex: "0 0 auto", width: "22px", height: "22px", margin: "1px 0 0", accentColor: "#176F69"}} />
                      </>
                    )}
                    {truthy(v.vn.consentOff) && (
                      <>
                      <input type="checkbox" onChange={v.vn.toggleConsent} style={{flex: "0 0 auto", width: "22px", height: "22px", margin: "1px 0 0", accentColor: "#176F69"}} />
                      </>
                    )}
                    <span>
                      {"I agree that Knowvia can store this voice note to understand my family's cover."}
                    </span>
                  </label>
                </div>
                </>
              )}
              <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
                <button className="kv-btn" type="submit" aria-disabled={v.close.busyStr} style={{width: "100%", height: "56px", border: "0", borderRadius: "999px", background: "#0F4A3A", color: "#FFFFFF", font: "inherit", fontSize: "17px", fontWeight: "600", letterSpacing: "0.005em", cursor: "pointer"}}>
                  {v.cm.buttonLabel}
                </button>
                {truthy(v.close.busy) && (
                  <>
                  <div aria-hidden="true" style={{height: "3px", borderRadius: "3px", background: "linear-gradient(90deg,#E6EFEC,#176F69,#E6EFEC)", backgroundSize: "200% 100%", animation: "kvLoad 1.2s linear infinite"}}></div>
                  </>
                )}
              </div>
              <p id="close-consent" style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#2E6B4A"}}>
                {"We use your email only to tell you when Knowvia opens. Read the "}
                <Link href="/privacy" style={{color: "#0F4A3A"}}>
                  {"privacy notice"}
                </Link>
                {"."}
              </p>
            </form>
            </>
          )}
          {" "}
          {truthy(v.close.showSuccess) && (
            <>
            <div role="status" style={{display: "flex", flexDirection: "column", gap: "10px", animation: "kvIn 420ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
              <span aria-hidden="true" style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "#FFFFFF"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#176F69" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <p style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#0F4A3A"}}>
                {"You are on the list."}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
                {"We will email "}{v.close.emailShown}{" when Knowvia opens. "}{v.cm.successExtra}{" While you wait, find your policy schedule and your employer's benefits booklet."}
              </p>
            </div>
            </>
          )}
          {" "}
          <div className="kv-backers" style={{marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(15,74,58,0.25)"}}>
            <span style={{fontSize: "15px", fontWeight: "600", color: "#0F4A3A"}}>
              {"Supported by"}
            </span>
            {" "}
            <img src="/logos/lightspeed.png" alt="Lightspeed" style={{height: "24px", width: "auto", display: "block"}} />
            {" "}
            <span aria-hidden="true" style={{width: "1px", height: "28px", background: "rgba(15,74,58,0.3)"}}></span>
            {" "}
            <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" style={{height: "30px", width: "auto", display: "block"}} />
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
