// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";


export function HouseholdControl() {
  return (
    <>
    <section id="privacy" aria-labelledby="privacy-h" style={{position: "relative", overflow: "hidden", background: "#163F42", color: "#FFFFFF", padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", left: "-200px", bottom: "-260px", width: "760px", height: "760px", opacity: "0.08"}}>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#C9DDD9" strokeWidth="3"></circle>
        <path d="M258 194v412M265 404l274 210M265 404l274-210" fill="none" stroke="#C9DDD9" strokeWidth="30" strokeLinecap="round"></path>
      </svg>
      {" "}
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "48px"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "16px", maxWidth: "720px"}}>
          <h2 id="privacy-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#FFFFFF", maxWidth: "16ch", textWrap: "balance"}}>
            {"Each person decides what family sees."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(18px,1.45vw,21px)", lineHeight: "1.5", color: "#C9DDD9", maxWidth: "48ch"}}>
            {"Share the cover amount with your family. Keep medical details to yourself. Change it whenever you like."}
          </p>
        </div>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "24px"}}>
          <article className="kv-rise kv-privcard" aria-label="Example: what you see" style={{background: "#FFFFFF", color: "#1A3034", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 30px 60px rgba(0,0,0,0.22)"}}>
            <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
              <span aria-hidden="true" style={{flex: "0 0 auto", width: "44px", height: "44px", borderRadius: "50%", background: "#DDF0DC", color: "#0F4A3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700"}}>
                {"You"}
              </span>
              <div>
                <h3 style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                  {"What you see"}
                </h3>
                <p style={{margin: "0", fontSize: "15px", color: "#2E6B4A", fontWeight: "600"}}>
                  {"Full access. It is your own record."}
                </p>
              </div>
            </div>
            <dl style={{margin: "0", display: "flex", flexDirection: "column"}}>
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA"}}>
                <dt style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
                  {"Cover amount"}
                </dt>
                <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                  {"₹5,00,000 floater"}
                </dd>
              </div>
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA"}}>
                <dt style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
                  {"Policy details"}
                </dt>
                <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                  {"Policy number, TPA, desk contact"}
                </dd>
              </div>
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", marginTop: "10px", padding: "14px 16px", borderRadius: "12px", background: "#F3F7F6"}}>
                <dt style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
                  {"Medical details"}
                </dt>
                <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5", display: "flex", alignItems: "center", gap: "8px"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E6B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                    <path className="kv-unlock" d="M8 11V8a4 4 0 0 1 8 0v3" style={{transformOrigin: "16px 11px"}}></path>
                  </svg>
                  <span className="kv-reveal">
                    {"Declared conditions"}
                  </span>
                </dd>
              </div>
            </dl>
          </article>
          <article className="kv-rise kv-privcard" aria-label="Example: what your brother sees" style={{background: "#FFFFFF", color: "#1A3034", borderRadius: "24px", padding: "clamp(24px,2.6vw,36px)", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 30px 60px rgba(0,0,0,0.22)"}}>
            <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
              <span aria-hidden="true" style={{flex: "0 0 auto", width: "44px", height: "44px", borderRadius: "50%", background: "#CDEBE5", color: "#163F42", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "700"}}>
                {"Bro"}
              </span>
              <div>
                <h3 style={{margin: "0", fontSize: "22px", fontWeight: "600", lineHeight: "1.3", color: "#163F42"}}>
                  {"What your brother sees"}
                </h3>
                <p style={{margin: "0", fontSize: "15px", color: "#55696D", fontWeight: "600"}}>
                  {"Only what you chose to share."}
                </p>
              </div>
            </div>
            <dl style={{margin: "0", display: "flex", flexDirection: "column"}}>
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA"}}>
                <dt style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
                  {"Cover amount"}
                </dt>
                <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                  {"₹5,00,000 floater"}
                </dd>
              </div>
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "4px 16px", padding: "14px 0", borderBottom: "1px solid #CFDCDA"}}>
                <dt style={{fontSize: "15px", fontWeight: "600", color: "#55696D"}}>
                  {"Policy details"}
                </dt>
                <dd style={{margin: "0", fontSize: "18px", lineHeight: "1.5"}}>
                  {"Policy number, TPA, desk contact"}
                </dd>
              </div>
              <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px 16px", marginTop: "10px", padding: "12px 14px 12px 16px", borderRadius: "12px", border: "2px solid #163F42", background: "#FFFFFF"}}>
                <dt style={{fontSize: "15px", fontWeight: "600", color: "#163F42"}}>
                  {"Medical details"}
                </dt>
                <dd style={{margin: "0", display: "flex", alignItems: "center", gap: "12px"}}>
                  <span style={{position: "relative", display: "inline-block", fontSize: "18px", whiteSpace: "nowrap"}}>
                    <span aria-hidden="true" style={{color: "#1A3034"}}>
                      {"Declared conditions"}
                    </span>
                    <span className="kv-redact" aria-hidden="true" style={{position: "absolute", left: "-4px", right: "-4px", top: "2px", bottom: "2px", borderRadius: "4px", background: "#163F42", transformOrigin: "left"}}></span>
                  </span>
                  <span style={{display: "inline-flex", alignItems: "center", gap: "8px", height: "34px", padding: "0 14px 0 10px", borderRadius: "999px", background: "#163F42", color: "#FFFFFF", fontSize: "16px", fontWeight: "700", whiteSpace: "nowrap"}}>
                    <svg className="kv-shake" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8E6A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                    </svg>
                    {"Not shared"}
                  </span>
                </dd>
              </div>
            </dl>
          </article>
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: "12px 40px", fontSize: "17px", lineHeight: "1.55"}}>
          <p style={{margin: "0", maxWidth: "48ch", color: "#FFFFFF"}}>
            {"Every adult controls their own record. "}
            <strong style={{fontWeight: "700", color: "#C8E6A0"}}>
              {"Medical details are never shared by default."}
            </strong>
          </p>
          <p style={{margin: "0", maxWidth: "48ch", color: "#C9DDD9"}}>
            {"You can also set emergency access in advance, for a moment you cannot speak for yourself."}
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
