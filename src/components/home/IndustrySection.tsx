// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";
/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function IndustrySection({ v }: { v: Any }) {
  return (
    <>
    <section id="industry" aria-labelledby="industry-h" style={{position: "relative", background: "#0F4A3A", color: "#FFFFFF", padding: "clamp(56px,6vw,88px) 0 clamp(24px,3vw,40px)"}}>
      <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{right: "-240px", top: "-200px", width: "820px", height: "820px", opacity: "0.08"}}>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
      </svg>
      {" "}
      <div className="kv-wrap" style={{position: "relative"}}>
        <div className="kv-nhead">
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <p className="kv-eyebrow kv-reveal" style={{color: "#C8E6A0"}}>
              {"Why it matters · 4 numbers"}
            </p>
            <h2 id="industry-h" className="kv-h2 kv-reveal" style={{color: "#FFFFFF", maxWidth: "18ch"}}>
              {"This keeps happening to families."}
            </h2>
            <p className="kv-lede kv-reveal kv-d120" style={{color: "#DDF0DC", maxWidth: "46ch"}}>
              {"Knowvia cannot overrule an insurer. "}
              <strong style={{fontWeight: "700", color: "#C8E6A0"}}>
                {"It changes the part you control:"}
              </strong>
              {" knowing your cover, and its rules, before the desk does."}
            </p>
          </div>
          {" "}
          <div>
            <ol className="kv-nidx" aria-label="Jump to a number">
              {(v.nidx ?? []).map((ni: Any, i1: number) => (
                <Fragment key={i1}>
                  <li>
                    <button type="button" aria-current={ni.cur} onClick={ni.go}>
                      <span className="kv-k">
                        {ni.k}
                      </span>
                      <span>
                        {ni.label}
                      </span>
                      <span className="kv-v">
                        {ni.v}
                      </span>
                    </button>
                  </li>
                </Fragment>
              ))}
            </ol>
            {" "}
            <p className="kv-eyebrow kv-reveal" style={{marginTop: "24px", fontSize: "13px", color: "#A8DCCB"}}>
              {"Sources"}
            </p>
            {" "}
            <ul className="kv-srcs" aria-label="Data sources">
              <li>
                <a className="kv-src" href="https://www.moneylife.in/article/health-insurance-claims-worth-rs2603765-crore-rejected-by-insurers-in-fy2324-govt/76282.html">
                  <img src="/logos/irdai.png" alt="Insurance Regulatory and Development Authority of India (IRDAI)" />
                </a>
              </li>
              <li>
                <a className="kv-src" href="https://www.moneylife.in/article/health-insurance-claims-worth-rs2603765-crore-rejected-by-insurers-in-fy2324-govt/76282.html">
                  <img src="/logos/lok-sabha.png" alt="Lok Sabha, Parliament of India" />
                </a>
              </li>
              <li>
                <a className="kv-src" href="https://www.localcircles.com/a/press/page/health-insurance-claim-survey">
                  <img src="/logos/localcircles.png" alt="LocalCircles" />
                </a>
              </li>
              <li>
                <a className="kv-src" href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265816&lang=1&reg=3">
                  <img src="/logos/ministry-of-health.png" alt="Ministry of Health and Family Welfare, Government of India" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        {" "}
        <div className="kv-scrolly">
          <div className="kv-pin" aria-hidden="true">
            <div className="kv-frames">
              <div className="kv-fcount">
                {(v.nf.bars ?? []).map((fb: Any, i2: number) => (
                  <Fragment key={i2}>
                    <i className={fb}></i>
                  </Fragment>
                ))}
              </div>
              {" "}
              <div className={v.nf.f0}>
                <span className="kv-fnum" style={{color: "#C8E6A0"}}>
                  {v.n.claims}
                </span>
                <div style={{display: "flex", alignItems: "flex-end", gap: "8px"}}>
                  {(v.people ?? []).map((pp: Any, i3: number) => (
                    <Fragment key={i3}>
                      <svg className={pp.cls} width="46" height="60" viewBox="0 0 34 44" style={{flex: "0 1 46px", minWidth: "0", height: "auto"}}>
                        <circle cx="17" cy="10" r="8" style={css(pp.delay)}></circle>
                        <path d="M3 43c0-9 6-16 14-16s14 7 14 16z" style={css(pp.delay)}></path>
                      </svg>
                    </Fragment>
                  ))}
                </div>
              </div>
              {" "}
              <div className={v.nf.f1}>
                <span className="kv-fnum" style={{color: "#DDF0DC", fontSize: "clamp(60px,7vw,116px)"}}>
                  {v.n.crore}
                </span>
                <div style={{display: "flex", flexDirection: "column", gap: "10px", maxWidth: "520px"}}>
                  <div style={{display: "flex", height: "22px", borderRadius: "5px", overflow: "hidden", gap: "3px"}}>
                    <span className="kv-bar" style={{flex: "15100 1 0", background: "#DDF0DC"}}></span>
                    <span className="kv-bar" style={{flex: "10937 1 0", background: "#A8DCCB", opacity: "0.6"}}></span>
                  </div>
                  <div style={{display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "15px", fontWeight: "600", color: "#DDF0DC"}}>
                    <span>
                      {"₹15,100 cr disallowed"}
                    </span>
                    <span>
                      {"₹10,937 cr repudiated"}
                    </span>
                  </div>
                </div>
              </div>
              {" "}
              <div className={v.nf.f2}>
                <span className="kv-fnum" style={{color: "#A8DCCB"}}>
                  {v.n.hours}
                </span>
                <div style={{display: "flex", flexDirection: "column", gap: "14px", maxWidth: "520px"}}>
                  <div style={{display: "flex", alignItems: "center", gap: "12px", fontSize: "15px", fontWeight: "600"}}>
                    <span style={{flex: "0 0 110px", color: "#DDF0DC"}}>
                      {"The rule"}
                    </span>
                    <span className="kv-bar" style={{height: "18px", width: "6.25%", minWidth: "10px", borderRadius: "4px", background: "#C8E6A0"}}></span>
                    <span>
                      {"3 h"}
                    </span>
                  </div>
                  <div style={{display: "flex", alignItems: "center", gap: "12px", fontSize: "15px", fontWeight: "600"}}>
                    <span style={{flex: "0 0 110px", color: "#DDF0DC"}}>
                      {"Families saw"}
                    </span>
                    <span className="kv-bar" style={{height: "18px", flex: "1 1 auto", borderRadius: "4px", background: "#A8DCCB"}}></span>
                    <span>
                      {"48 h"}
                    </span>
                  </div>
                </div>
              </div>
              {" "}
              <div className={v.nf.f3}>
                <span className="kv-fnum" style={{color: "#F6D38A"}}>
                  {v.n.oop}
                </span>
                <div style={{display: "grid", gridTemplateColumns: "repeat(20,minmax(0,1fr))", gap: "4px", maxWidth: "440px"}}>
                  {(v.grid ?? []).map((g: Any, i4: number) => (
                    <Fragment key={i4}>
                      <span className={g.cls} style={css(g.style)}></span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {" "}
          <div>
            <div className={v.nf.s0} data-step="0">
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "22px", color: "#C8E6A0"}}>
                {"01"}
              </span>
              <span className="kv-mnum" style={{color: "#C8E6A0"}}>
                {"44%"}
              </span>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(22px,2vw,30px)", lineHeight: "1.3"}}>
                {"of people who claimed say it was rejected or only partly paid, for reasons they found invalid."}
              </p>
              <div className="kv-stepsrc">
                <img src="/logos/localcircles.png" alt="LocalCircles" />
                <span>
                  {"18,989 responses, claims made 2023 to 2025: 15% rejected, 29% partly paid. 7 March 2026."}
                </span>
              </div>
            </div>
            {" "}
            <div className={v.nf.s1} data-step="1">
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "22px", color: "#C8E6A0"}}>
                {"02"}
              </span>
              <span className="kv-mnum" style={{color: "#DDF0DC"}}>
                {"₹26,037 cr"}
              </span>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(22px,2vw,30px)", lineHeight: "1.3"}}>
                {"of health insurance claims were rejected or disallowed by insurers in a single year, 2023-24."}
              </p>
              <div className="kv-stepsrc">
                <img src="/logos/lok-sabha.png" alt="Lok Sabha" />
                <img src="/logos/irdai.png" alt="IRDAI" />
                <span>
                  {"Reply by the Minister of State for Finance, using IRDAI data. 7 February 2025."}
                </span>
              </div>
            </div>
            {" "}
            <div className={v.nf.s2} data-step="2">
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "22px", color: "#C8E6A0"}}>
                {"03"}
              </span>
              <span className="kv-mnum" style={{color: "#A8DCCB"}}>
                {"48 hours"}
              </span>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(22px,2vw,30px)", lineHeight: "1.3"}}>
                {"is the longest wait families reported for approval and discharge. The rule for discharge is 3 hours."}
              </p>
              <div className="kv-stepsrc">
                <img src="/logos/localcircles.png" alt="LocalCircles" />
                <img src="/logos/irdai.png" alt="IRDAI" />
                <span>
                  {"18,119 responses: 5 in 10 claimants waited 6 to 48 hours. 7 March 2026."}
                </span>
              </div>
            </div>
            {" "}
            <div className={v.nf.s3} data-step="3">
              <span style={{fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "22px", color: "#C8E6A0"}}>
                {"04"}
              </span>
              <span className="kv-mnum" style={{color: "#F6D38A"}}>
                {"43%"}
              </span>
              <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "clamp(22px,2vw,30px)", lineHeight: "1.3"}}>
                {"of what India spends on health comes straight out of people's own pockets."}
              </p>
              <div className="kv-stepsrc">
                <img src="/logos/ministry-of-health.png" alt="Ministry of Health and Family Welfare" />
                <span>
                  {"National Health Accounts 2022-23: 43.4% of total health expenditure."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
