// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";


export function HowItWorksSection() {
  return (
    <>
    <section id="how" aria-labelledby="how-h" style={{padding: "clamp(72px,9vw,120px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1050px", margin: "0 auto"}}>
        <h2 id="how-h" style={{margin: "0 0 14px", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", color: "#163F42"}}>
          {"Every answer comes with proof and a next step."}
        </h2>
        <p style={{margin: "0 0 36px", fontSize: "20px"}}>
          {"One example policy check, shown the way Knowvia would return it."}
        </p>
        <article className="kv-policy-scan" style={{background: "#FFFFFF", border: "1px solid #CFDCDA", borderRadius: "24px", padding: "clamp(24px,3vw,40px)"}}>
          <p style={{margin: "0 0 18px", fontSize: "21px", fontWeight: "600", color: "#163F42"}}>
            {"Example policy answer"}
          </p>
          {" "}
          <div className="kv-answer-row" style={{padding: "22px 0", borderTop: "1px solid #CFDCDA", display: "grid", gridTemplateColumns: "0.8fr 1.3fr 1fr", gap: "18px"}}>
            <div>
              <strong style={{padding: "5px 9px", borderRadius: "6px", background: "#E3F0EE"}}>
                {"Known"}
              </strong>
              <p style={{fontWeight: "600"}}>
                {"Sum insured ₹5,00,000"}
              </p>
            </div>
            <p>
              <strong>
                {"Document:"}
              </strong>
              {" Family health policy"}
              <br />
              <strong>
                {"Proof:"}
              </strong>
              {" Page 2, policy schedule"}
            </p>
            <p>
              <strong>
                {"Who:"}
              </strong>
              {" You"}
              <br />
              <strong>
                {"When:"}
              </strong>
              {" Before admission"}
            </p>
          </div>
          {" "}
          <div className="kv-answer-row" style={{padding: "22px 0", borderTop: "1px solid #CFDCDA", display: "grid", gridTemplateColumns: "0.8fr 1.3fr 1fr", gap: "18px"}}>
            <div>
              <strong style={{padding: "5px 9px", borderRadius: "6px", background: "#FBF1DD", color: "#7A5207"}}>
                {"Not confirmed"}
              </strong>
              <p style={{fontWeight: "600"}}>
                {"Room-rent limit is not stated here"}
              </p>
            </div>
            <p>
              <strong>
                {"Document:"}
              </strong>
              {" Employer benefits booklet"}
              <br />
              <strong>
                {"Proof:"}
              </strong>
              {" Hospitalisation section"}
            </p>
            <p>
              <strong>
                {"Who:"}
              </strong>
              {" HR benefits team"}
              <br />
              <strong>
                {"When:"}
              </strong>
              {" Before choosing a room"}
            </p>
          </div>
          {" "}
          <div className="kv-answer-row" style={{padding: "22px 0 0", borderTop: "1px solid #CFDCDA", display: "grid", gridTemplateColumns: "0.8fr 1.3fr 1fr", gap: "18px"}}>
            <div>
              <strong style={{padding: "5px 9px", borderRadius: "6px", background: "#163F42", color: "#FFFFFF"}}>
                {"Next"}
              </strong>
              <p style={{fontWeight: "600"}}>
                {"Confirm the ₹2,00,000 gap"}
              </p>
            </div>
            <p>
              <strong>
                {"Document:"}
              </strong>
              {" Super top-up quote"}
              <br />
              <strong>
                {"Proof:"}
              </strong>
              {" Page 1, deductible"}
            </p>
            <p>
              <strong>
                {"Who:"}
              </strong>
              {" Insurer or adviser"}
              <br />
              <strong>
                {"When:"}
              </strong>
              {" Before paying"}
            </p>
          </div>
        </article>
      </div>
    </section>
    </>
  );
}
