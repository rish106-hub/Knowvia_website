// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";


export function HowItWorksSection() {
  return (
    <>
    <section id="how" aria-labelledby="how-h" style={{padding: "clamp(72px,9vw,128px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "48px"}}>
        <div style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px 48px"}}>
          <h2 id="how-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", letterSpacing: "-0.015em", color: "#163F42", maxWidth: "14ch", textWrap: "balance"}}>
            {"See three answers for every person."}
          </h2>
          <p style={{margin: "0", fontSize: "clamp(19px,1.46vw,21px)", lineHeight: "1.5", maxWidth: "42ch"}}>
            {"When Knowvia opens, add the health policies you already have. It reads them person by person."}
          </p>
        </div>
        <div style={{display: "flex", flexWrap: "wrap", gap: "24px"}}>
          <article className="kv-tile kv-rise" style={{flex: "7 1 520px", background: "#FFFFFF", borderRadius: "24px", padding: "clamp(24px,3vw,40px)", display: "flex", flexDirection: "column", gap: "20px", border: "1px solid #CFDCDA"}}>
            <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", height: "32px", padding: "0 12px", borderRadius: "8px", background: "#E3F0EE", color: "#163F42", fontSize: "16px", fontWeight: "600"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12.5 10 17 19 7"></polyline>
              </svg>
              {"Known"}
            </span>
            <h3 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(28px,2.4vw,36px)", lineHeight: "1.12", color: "#163F42"}}>
              {"What your documents prove, with the page."}
            </h3>
            <ul aria-label="Example known facts" style={{listStyle: "none", margin: "8px 0 0", padding: "0", display: "flex", flexDirection: "column", gap: "10px"}}>
              <li style={{display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", padding: "14px 18px", borderRadius: "12px", background: "#F3F7F6"}}>
                <span style={{fontSize: "18px"}}>
                  {"Sum insured ₹5,00,000"}
                </span>
                <span style={{flex: "0 0 auto", fontSize: "14px", fontWeight: "600", color: "#163F42", background: "#E3F0EE", borderRadius: "6px", padding: "4px 8px"}}>
                  {"Page 2"}
                </span>
              </li>
              <li style={{display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", padding: "14px 18px", borderRadius: "12px", background: "#F3F7F6"}}>
                <span style={{fontSize: "18px"}}>
                  {"Maa is enrolled as a dependant"}
                </span>
                <span style={{flex: "0 0 auto", fontSize: "14px", fontWeight: "600", color: "#163F42", background: "#E3F0EE", borderRadius: "6px", padding: "4px 8px"}}>
                  {"Page 4"}
                </span>
              </li>
              <li style={{display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", padding: "14px 18px", borderRadius: "12px", background: "#F3F7F6"}}>
                <span style={{fontSize: "18px"}}>
                  {"Waiting period for cataract: 2 years"}
                </span>
                <span style={{flex: "0 0 auto", fontSize: "14px", fontWeight: "600", color: "#163F42", background: "#E3F0EE", borderRadius: "6px", padding: "4px 8px"}}>
                  {"Page 11"}
                </span>
              </li>
            </ul>
            <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
              {"Example values"}
            </p>
          </article>
          <div style={{flex: "5 1 380px", display: "flex", flexDirection: "column", gap: "24px"}}>
            <article className="kv-tile kv-march kv-rise" style={{backgroundColor: "#FBF1DD", borderRadius: "24px", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: "14px"}}>
              <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", height: "32px", padding: "0 12px", borderRadius: "8px", background: "#FFFFFF", color: "#7A5207", border: "1.5px dashed #7A5207", boxSizing: "border-box", fontSize: "16px", fontWeight: "600"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4"></path>
                </svg>
                {"Not confirmed"}
              </span>
              <h3 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(26px,2.2vw,32px)", lineHeight: "1.15", color: "#163F42"}}>
                {"Missing or unclear? We mark it."}
              </h3>
              <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.6", color: "#1A3034"}}>
                <strong style={{fontWeight: "700"}}>
                  {"We never guess."}
                </strong>
                {" If two documents disagree, both stay visible and we name who can answer."}
              </p>
            </article>
            <article className="kv-tile kv-rise" style={{position: "relative", overflow: "hidden", background: "#163F42", color: "#FFFFFF", borderRadius: "24px", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: "14px"}}>
              <svg aria-hidden="true" viewBox="0 0 800 800" style={{position: "absolute", right: "-90px", bottom: "-110px", width: "320px", height: "320px", opacity: "0.18"}}>
                <path d="M258 194v412M265 404l274 210" fill="none" stroke="#C9DDD9" strokeWidth="44" strokeLinecap="round"></path>
                <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="44" strokeLinecap="round"></path>
              </svg>
              <span style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", height: "32px", padding: "0 12px", borderRadius: "8px", background: "#FFFFFF", color: "#163F42", fontSize: "16px", fontWeight: "600"}}>
                <span aria-hidden="true" style={{width: "10px", height: "10px", borderRadius: "50%", background: "#E0A02B"}}></span>
                {"Next"}
              </span>
              <h3 style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(26px,2.2vw,32px)", lineHeight: "1.15", color: "#FFFFFF"}}>
                {"One step, who does it, and by when."}
              </h3>
              <p style={{margin: "0", fontSize: "clamp(17px,1.35vw,19px)", lineHeight: "1.6", color: "#C9DDD9"}}>
                {"Not a lecture about what you should have done."}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
