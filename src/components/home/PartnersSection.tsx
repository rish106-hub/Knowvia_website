// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { type Any } from "@/lib/dc";

export function PartnersSection({ v }: { v: Any }) {
  return (
    <>
    <section id="partners" aria-labelledby="partners-h" style={{position: "relative", overflow: "hidden", background: "#163F42", color: "#FFFFFF", padding: "clamp(72px,9vw,128px) 0"}}>
      <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{left: "-300px", bottom: "-320px", width: "760px", height: "760px", opacity: "0.08"}}>
        <circle cx="400" cy="400" r="290" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="240" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
        <circle cx="400" cy="400" r="190" fill="none" stroke="#A8DCCB" strokeWidth="3"></circle>
      </svg>
      {" "}
      <div className="kv-wrap kv-partners" style={{position: "relative"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
          <p style={{margin: "0", display: "inline-flex", alignItems: "center", gap: "10px", color: "#FFFFFF"}}>
            <svg width="30" height="30" viewBox="0 0 800 800" aria-hidden="true">
              <rect width="800" height="800" rx="144" fill="#0F4A3A"></rect>
              <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
              <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
              <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
            </svg>
            <span style={{fontSize: "20px", fontWeight: "600", letterSpacing: "-0.01em"}}>
              {"Knowvia"}
            </span>
            <span style={{display: "inline-flex", alignItems: "center", height: "28px", padding: "0 12px", borderRadius: "999px", background: "#C8E6A0", color: "#0F4A3A", fontSize: "14px", fontWeight: "700", letterSpacing: "0.02em"}}>
              {"for Business"}
            </span>
          </p>
          <h2 id="partners-h" className="kv-h2 kv-reveal" style={{color: "#FFFFFF", maxWidth: "16ch"}}>
            {"Fewer “what does my policy cover?” calls."}
          </h2>
          <p className="kv-lede kv-reveal kv-d120" style={{color: "#D6E6E3", maxWidth: "44ch"}}>
            {"For HR platforms, insurance platforms and advisers. Your employees and customers get a clear view of every policy in their household. You keep your own support relationship."}
          </p>
          <a className="kv-lime" href="#ask" style={{alignSelf: "flex-start", display: "inline-flex", alignItems: "center", height: "52px", padding: "0 26px", borderRadius: "999px", background: "#C8E6A0", color: "#0F4A3A", fontSize: "17px", fontWeight: "700", textDecoration: "none", whiteSpace: "nowrap"}}>
            {"Talk to us about a pilot"}
          </a>
        </div>
        {" "}
        <div style={{position: "relative"}}>
          <span className={v.flowCls} aria-hidden="true">
            <i></i>
          </span>
          {" "}
          <ol className="kv-vflow" aria-label="How a pilot works">
            <li className="kv-vstep">
              <span className="kv-vn" aria-hidden="true">
                {"1"}
              </span>
              <p style={{margin: "6px 0 6px", fontSize: "22px", fontWeight: "700"}}>
                {"Your platform"}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#D6E6E3", maxWidth: "40ch"}}>
                {"At joining or a benefits change on HR platforms. After a purchase or renewal on insurance platforms."}
              </p>
            </li>
            <li className="kv-vstep">
              <span className="kv-vn" aria-hidden="true">
                {"2"}
              </span>
              <p style={{margin: "6px 0 6px", fontSize: "22px", fontWeight: "700"}}>
                {"The person says yes"}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#D6E6E3", maxWidth: "40ch"}}>
                {"No data moves without their consent, field by field."}
              </p>
            </li>
            <li className="kv-vstep">
              <span className="kv-vn" aria-hidden="true">
                {"3"}
              </span>
              <p style={{margin: "6px 0 6px", fontSize: "22px", fontWeight: "700"}}>
                {"Knowvia reads it"}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#D6E6E3", maxWidth: "40ch"}}>
                {"Every policy in the household, person by person, linked to the issued policy."}
              </p>
            </li>
            <li className="kv-vstep">
              <span className="kv-vn" aria-hidden="true" style={{background: "#C8E6A0", color: "#0F4A3A"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 12.5 10 17 19 7"></polyline>
                </svg>
              </span>
              <p style={{margin: "6px 0 6px", fontSize: "22px", fontWeight: "700"}}>
                {"You keep the relationship"}
              </p>
              <p style={{margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#D6E6E3", maxWidth: "40ch"}}>
                {"Your team stays the support contact. Knowvia does the reading."}
              </p>
            </li>
          </ol>
        </div>
      </div>
    </section>
    </>
  );
}
