// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import Link from "next/link";
import { type Any, css, truthy } from "@/lib/dc";

export function EarlyListSection({ v }: { v: Any }) {
  return (
    <>
    <section id="early-list" aria-labelledby="close-h" style={{position: "relative", overflow: "hidden", background: "#163F42", color: "#FFFFFF", padding: "clamp(72px,8vw,112px) clamp(20px,5vw,80px)"}}>
      <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", left: "-260px", bottom: "-300px", width: "760px", height: "760px", opacity: "0.08"}}>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <path d="M258 194v412M265 404l274 210" fill="none" stroke="#C9DDD9" strokeWidth="34" strokeLinecap="round"></path>
        <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="34" strokeLinecap="round"></path>
      </svg>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "40px 72px", alignItems: "flex-start"}}>
        <div style={{flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "18px", maxWidth: "460px"}}>
          <p style={{margin: "0", fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em", color: "#C8E6A0"}}>
            {"The early list"}
          </p>
          <h2 id="close-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(36px,4vw,56px)", lineHeight: "1.05", letterSpacing: "-0.015em", color: "#FFFFFF", maxWidth: "12ch"}}>
            {"Know your cover. Before you need it."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.55", color: "#C9DDD9", maxWidth: "38ch"}}>
            {"Tell us a little about your family's health cover, in writing or in your own voice. It helps us decide what Knowvia reads first for you."}
          </p>
          <ul style={{listStyle: "none", margin: "8px 0 0", padding: "0", display: "flex", flexDirection: "column", gap: "12px"}}>
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
        <div style={{flex: "1.2 1 480px", maxWidth: "620px", background: "#FFFFFF", color: "#1A3034", borderRadius: "24px", padding: "clamp(22px,2.6vw,36px)", boxShadow: "0 30px 60px rgba(0,0,0,0.25)"}}>
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
              <div style={{display: "flex", flexWrap: "wrap", gap: "14px"}}>
                <div style={{flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "8px"}}>
                  <label htmlFor="close-name" style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em"}}>
                    {"First name "}
                    <span style={{fontWeight: "400", color: "#55696D"}}>
                      {"(optional)"}
                    </span>
                  </label>
                  <input id="close-name" name="given-name" type="text" autoComplete="given-name" onChange={v.cm.setName} style={{height: "52px", boxSizing: "border-box", padding: "0 16px", borderRadius: "12px", border: "1px solid #7B918E", background: "#FFFFFF", font: "inherit", fontSize: "17px", color: "#1A3034"}} />
                </div>
                <div style={{flex: "1.4 1 240px", display: "flex", flexDirection: "column", gap: "8px"}}>
                  <label htmlFor="close-email" style={{fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em"}}>
                    {"Email"}
                  </label>
                  <input id="close-email" name="email" type="email" autoComplete="email" onChange={v.close.setEmail} aria-invalid={v.close.invalid} aria-describedby="close-error close-consent" style={css(v.cm.emailStyle)} />
                </div>
              </div>
              <p id="close-error" role="alert" style={{margin: "-8px 0 0", color: "#A74335", fontSize: "16px", lineHeight: "1.45", fontWeight: "600"}}>
                {v.close.error}
              </p>
              {truthy(v.cm.isWrite) && (
                <>
                <div style={{display: "flex", flexDirection: "column", gap: "18px", animation: "kvIn 320ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                  <fieldset style={{margin: "0", padding: "0", border: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
                    <legend style={{padding: "0", marginBottom: "6px", fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em"}}>
                      {"Which health policies does your family have? "}
                      <span style={{fontWeight: "400", color: "#55696D"}}>
                        {"(optional)"}
                      </span>
                    </legend>
                    <div style={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
                      {(v.policies ?? []).map((pc: Any, i1: number) => (
                        <Fragment key={i1}>
                          <button className="kv-chip-opt" type="button" onClick={pc.toggle} aria-pressed={pc.on} style={css(pc.style)}>
                            {truthy(pc.isOn) && (
                              <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="5 12.5 10 17 19 7"></polyline>
                              </svg>
                              </>
                            )}
                            <span>
                              {pc.label}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset aria-describedby="events-purpose" style={{margin: "0", padding: "0", border: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
                    <legend style={{padding: "0", marginBottom: "6px", fontSize: "15px", fontWeight: "600", letterSpacing: "0.01em"}}>
                      {"What is coming up? "}
                      <span style={{fontWeight: "400", color: "#55696D"}}>
                        {"(optional)"}
                      </span>
                    </legend>
                    <div style={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
                      {(v.events ?? []).map((ev: Any, i2: number) => (
                        <Fragment key={i2}>
                          <button className="kv-chip-opt" type="button" onClick={ev.toggle} aria-pressed={ev.on} style={css(ev.style)}>
                            {truthy(ev.isOn) && (
                              <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="5 12.5 10 17 19 7"></polyline>
                              </svg>
                              </>
                            )}
                            <span>
                              {ev.label}
                            </span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                    <p id="events-purpose" style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#55696D"}}>
                      {"We use your answers only to decide what Knowvia reads first for you."}
                    </p>
                  </fieldset>
                </div>
                </>
              )}
              {truthy(v.cm.isVoice) && (
                <>
                <div style={{display: "flex", flexDirection: "column", gap: "14px", animation: "kvIn 320ms cubic-bezier(0.165,0.84,0.44,1) both"}}>
                  <div style={{display: "flex", flexDirection: "column", gap: "14px", padding: "18px", borderRadius: "16px", background: "#F3F7F6", border: "1px solid #CFDCDA"}}>
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
                          {(v.vn.bars ?? []).map((b: Any, i3: number) => (
                            <Fragment key={i3}>
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
                <button className="kv-btn" type="submit" aria-disabled={v.close.busyStr} style={{width: "100%", height: "56px", border: "0", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", font: "inherit", fontSize: "17px", fontWeight: "600", letterSpacing: "0.005em", cursor: "pointer"}}>
                  {v.cm.buttonLabel}
                </button>
                {truthy(v.close.busy) && (
                  <>
                  <div aria-hidden="true" style={{height: "3px", borderRadius: "3px", background: "linear-gradient(90deg,#E6EFEC,#176F69,#E6EFEC)", backgroundSize: "200% 100%", animation: "kvLoad 1.2s linear infinite"}}></div>
                  </>
                )}
              </div>
              <p id="close-consent" style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#55696D"}}>
                {"We use your email only to tell you when Knowvia opens. Read the "}
                <Link href="/privacy">
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
              <span aria-hidden="true" style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "#E3F0EE"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#176F69" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <p style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                {"You are on the list."}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.6"}}>
                {"We will email "}{v.close.emailShown}{" when Knowvia opens. "}{v.cm.successExtra}{" While you wait, find your policy schedule and your employer's benefits booklet."}
              </p>
            </div>
            </>
          )}
        </div>
      </div>
    </section>
    </>
  );
}
