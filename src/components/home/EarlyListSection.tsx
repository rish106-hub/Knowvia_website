"use client";
/* eslint-disable @next/next/no-img-element -- logos keep a fixed height with natural width */

import "./sb-close.css";
import { Fragment } from "react";
import Link from "next/link";
import { type Any, css, truthy } from "@/lib/dc";

export function EarlyListSection({ v }: { v: Any }) {
  return (
    <section id="early-list" className="sb-join" aria-labelledby="close-h">
      <div className="sb-join-l on-dark">
        <h2 id="close-h" className="sb-mask">
          {"Know your cover. "}
          <span className="mk">{"Before you need it."}</span>
        </h2>
        <p className="sb-rv">
          {"Only your email is required. Tell us which policies your family has, and Knowvia reads those first for you."}
        </p>
        <ul className="sb-rv" style={{ ["--d" as string]: "120ms" }}>
          <li>{"Every answer shows the page it came from."}</li>
          <li>{"Your answers are never sold or shared."}</li>
          <li>{"One email when we open. Nothing before."}</li>
        </ul>
      </div>
      <div className="sb-join-r">
        <div className="sb-join-in">
          {truthy(v.close.showForm) && (
            <form className="sb-form" onSubmit={v.close.submit} noValidate>
              {truthy(v.cm.showTabs) && (
                <div className="sb-seg" role="group" aria-label="How do you want to tell us?">
                  <button type="button" onClick={v.cm.setWrite} aria-pressed={v.cm.isWriteStr}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20h4L19 9l-4-4L4 16z"></path>
                      <path d="M13 7l4 4"></path>
                    </svg>
                    {"Write it"}
                  </button>
                  <button type="button" onClick={v.cm.setVoice} aria-pressed={v.cm.isVoiceStr}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3"></rect>
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>
                    </svg>
                    {"Say it"}
                  </button>
                </div>
              )}
              <div className="sb-field">
                <label className="sb-label" htmlFor="close-email">
                  {"Email "}
                  <span className="sb-req">{"Required"}</span>
                </label>
                <input className="sb-input" id="close-email" name="email" type="email" autoComplete="email" required onChange={v.close.setEmail} aria-invalid={v.close.invalid} aria-describedby="close-error close-consent" />
                <p className="sb-err" id="close-error" role="alert">
                  {v.close.error}
                </p>
              </div>
              {truthy(v.cm.isWrite) && (
                <div className="sb-field sb-fade">
                  <span className="sb-label" id="pol-label">
                    {"Which health policies does your family have?"}
                  </span>
                  <button className="sb-sel" type="button" onClick={v.ms.toggle} aria-expanded={v.ms.openStr} aria-controls="pol-list" aria-labelledby="pol-label pol-value">
                    <span className={"sb-sel-val" + (v.ms.summary && (v.policies ?? []).some((p: Any) => truthy(p.isOn)) ? " has" : "")} id="pol-value">
                      {v.ms.summary}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </button>
                  <div id="pol-list">
                    {truthy(v.ms.open) && (
                      <div className="sb-pol" role="group" aria-labelledby="pol-label">
                        {(v.policies ?? []).map((pc: Any, i1: number) => (
                          <Fragment key={i1}>
                            <button type="button" onClick={pc.toggle} aria-pressed={pc.on}>
                              {pc.label}
                            </button>
                          </Fragment>
                        ))}
                        <button className="sb-done" type="button" onClick={v.ms.toggle}>
                          {"Done"}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="sb-note">{"Choose any. We use this only to decide what Knowvia reads first for you."}</p>
                </div>
              )}
              {truthy(v.cm.isVoice) && (
                <div className="sb-voice sb-fade">
                  <div className="sb-voice-card">
                    <div className="sb-voice-row">
                      {truthy(v.vn.isIdle) && (
                        <button className="sb-mic" type="button" onClick={v.vn.start} aria-disabled={v.vn.lockedStr} aria-label="Start recording a voice note">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="3" width="6" height="11" rx="3"></rect>
                            <path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>
                          </svg>
                        </button>
                      )}
                      {truthy(v.vn.isRec) && (
                        <button className="sb-mic rec kv-rec" type="button" onClick={v.vn.stop} aria-label="Stop recording">
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"></rect>
                          </svg>
                        </button>
                      )}
                      {truthy(v.vn.isDone) && (
                        <button className="sb-mic play" type="button" onClick={v.vn.play} aria-label={v.vn.playLabel}>
                          {truthy(v.vn.playing) && (
                            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"></rect>
                              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"></rect>
                            </svg>
                          )}
                          {truthy(v.vn.paused) && (
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M8 5.5v13l11-6.5z" fill="currentColor"></path>
                            </svg>
                          )}
                        </button>
                      )}
                      <div className="sb-voice-meta">
                        <div className="sb-bars" aria-hidden="true">
                          {(v.vn.bars ?? []).map((b: Any, i2: number) => (
                            <Fragment key={i2}>
                              <span style={css(b.style)}></span>
                            </Fragment>
                          ))}
                        </div>
                        <p className="sb-status" aria-live="polite">
                          <span>{v.vn.status}</span>
                          <span>{v.vn.time}</span>
                        </p>
                      </div>
                    </div>
                    <p className="sb-note" style={{ opacity: 1 }}>
                      {"Up to 60 seconds. Tell us which policies your family has and what is on your mind. Speak in English or Hindi."}
                    </p>
                    {truthy(v.vn.isDone) && (
                      <button className="sb-link" type="button" onClick={v.vn.redo}>
                        {"Record again"}
                      </button>
                    )}
                  </div>
                  <label className="sb-check">
                    {truthy(v.vn.consentOn) && <input type="checkbox" defaultChecked onChange={v.vn.toggleConsent} />}
                    {truthy(v.vn.consentOff) && <input type="checkbox" onChange={v.vn.toggleConsent} />}
                    <span>{"I agree that Knowvia can store this voice note to understand my family's cover."}</span>
                  </label>
                </div>
              )}
              <div className="sb-field" style={{ gap: 10 }}>
                <button className="sb-btn dk" type="submit" aria-disabled={v.close.busyStr}>
                  {v.cm.buttonLabel}
                </button>
                {truthy(v.close.busy) && <div className="sb-bar" aria-hidden="true"></div>}
              </div>
              <p className="sb-note" id="close-consent">
                {"We use your email only to tell you about your Knowvia access. Read the "}
                <Link href="/privacy">{"privacy notice"}</Link>
                {"."}
              </p>
            </form>
          )}
          {truthy(v.close.showSuccess) && (
            <div className="sb-ok" role="status">
              <span className="sb-ok-ic" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <p className="sb-ok-t">{"You are on the list."}</p>
              <p>
                {"We will email "}{v.close.emailShown}{" with your Knowvia access. "}{v.cm.successExtra}{" While you wait, find your policy schedule and your employer's benefits booklet."}
              </p>
              <a className="sb-btn" href={v.close.betaUrl}>
                {"Try the beta now"}
              </a>
            </div>
          )}
          <div className="sb-backers">
            <span>{"Supported by"}</span>
            <img src="/logos/lightspeed.png" alt="Lightspeed" style={{ height: 24 }} />
            <span className="sep" aria-hidden="true"></span>
            <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" style={{ height: 30 }} />
          </div>
        </div>
      </div>
    </section>
  );
}
