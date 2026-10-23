// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";


export function HouseholdControl() {
  return (
    <>
    <section id="privacy" aria-labelledby="privacy-h" style={{background: "#163F42", color: "#FFFFFF", padding: "clamp(72px,9vw,120px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto"}}>
        <h2 id="privacy-h" style={{margin: "0 0 14px", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", color: "#FFFFFF"}}>
          {"Each person decides what family sees."}
        </h2>
        <p style={{margin: "0 0 36px", fontSize: "19px", color: "#C9DDD9"}}>
          {"The same record can show useful cover details without exposing medical information."}
        </p>
        <div className="kv-privacy-grid" style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "20px"}}>
          <article style={{background: "#FFFFFF", color: "#1A3034", borderRadius: "20px", padding: "28px"}}>
            <h3 style={{margin: "0", color: "#163F42"}}>
              {"What you see"}
            </h3>
            <p style={{margin: "6px 0 18px", color: "#2E6B4A"}}>
              {"Full access to your own record."}
            </p>
            <dl style={{margin: "0"}}>
              <div style={{padding: "14px 0", borderTop: "1px solid #CFDCDA"}}>
                <dt style={{fontWeight: "700", color: "#55696D"}}>
                  {"Cover amount"}
                </dt>
                <dd style={{margin: "5px 0 0"}}>
                  {"₹5,00,000 floater"}
                </dd>
              </div>
              <div style={{padding: "14px 0", borderTop: "1px solid #CFDCDA"}}>
                <dt style={{fontWeight: "700", color: "#55696D"}}>
                  {"Policy details"}
                </dt>
                <dd style={{margin: "5px 0 0"}}>
                  {"Policy number, TPA, hospital contact"}
                </dd>
              </div>
              <div style={{padding: "14px 0", borderTop: "1px solid #CFDCDA"}}>
                <dt style={{fontWeight: "700", color: "#55696D"}}>
                  {"Medical details"}
                </dt>
                <dd style={{margin: "5px 0 0"}}>
                  {"Declared conditions on your proposal form"}
                </dd>
              </div>
            </dl>
          </article>
          <article style={{background: "#FFFFFF", color: "#1A3034", borderRadius: "20px", padding: "28px"}}>
            <h3 style={{margin: "0", color: "#163F42"}}>
              {"What your brother sees"}
            </h3>
            <p style={{margin: "6px 0 18px", color: "#55696D"}}>
              {"Only what you chose to share."}
            </p>
            <dl style={{margin: "0"}}>
              <div style={{padding: "14px 0", borderTop: "1px solid #CFDCDA"}}>
                <dt style={{fontWeight: "700", color: "#55696D"}}>
                  {"Cover amount"}
                </dt>
                <dd style={{margin: "5px 0 0"}}>
                  {"₹5,00,000 floater"}
                </dd>
              </div>
              <div style={{padding: "14px 0", borderTop: "1px solid #CFDCDA"}}>
                <dt style={{fontWeight: "700", color: "#55696D"}}>
                  {"Policy details"}
                </dt>
                <dd style={{margin: "5px 0 0"}}>
                  {"Policy number, TPA, hospital contact"}
                </dd>
              </div>
              <div className="kv-private-row" style={{padding: "14px", borderRadius: "12px", background: "#E6EFEC", border: "2px solid #163F42"}}>
                <dt style={{fontWeight: "700", color: "#55696D"}}>
                  {"Medical details"}
                </dt>
                <dd style={{margin: "7px 0 0", display: "flex", alignItems: "center", gap: "9px", fontWeight: "700", color: "#163F42"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2"></rect>
                    <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                  </svg>
                  <span className="kv-redacted">
                    {"Not shared"}
                  </span>
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </div>
    </section>
    </>
  );
}
