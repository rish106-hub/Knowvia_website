// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";

export function PartnersSection() {
  return (
    <>
    <section id="partners" aria-labelledby="partners-h" style={{background: "#E6EFEC", padding: "clamp(72px,8vw,104px) clamp(20px,5vw,80px)", borderTop: "10px solid #163F42"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "40px 72px", alignItems: "center"}}>
        <div style={{flex: "1 1 460px"}}>
          <p style={{margin: "0 0 14px", fontWeight: "700", color: "#2E6B4A"}}>
            {"Knowvia for Business"}
          </p>
          <h2 id="partners-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", lineHeight: "1.08", color: "#163F42"}}>
            {"Fewer policy questions. Better prepared people."}
          </h2>
          <p style={{fontSize: "19px", lineHeight: "1.6"}}>
            {"Give employees and customers a clearer view of the health cover they already have."}
          </p>
          <Link className="kv-out" href="/for-partners" style={{display: "inline-flex", alignItems: "center", height: "52px", padding: "0 26px", borderRadius: "999px", border: "2px solid #176F69", color: "#176F69", fontWeight: "600", textDecoration: "none"}}>
            {"See Knowvia for Business"}
          </Link>
        </div>
        <div style={{flex: "1 1 390px", background: "#FFFFFF", borderRadius: "22px", padding: "28px"}}>
          <p style={{fontSize: "18px", lineHeight: "1.55"}}>
            <strong>
              {"HR platforms:"}
            </strong>
            {" clearer benefit answers at joining and renewal."}
          </p>
          <p style={{paddingTop: "18px", borderTop: "1px solid #CFDCDA", fontSize: "18px", lineHeight: "1.55"}}>
            <strong>
              {"Insurance platforms and advisers:"}
            </strong>
            {" proof-based explanations after purchase."}
          </p>
          <p style={{paddingTop: "18px", borderTop: "1px solid #CFDCDA", fontSize: "18px", lineHeight: "1.55"}}>
            <strong>
              {"Data boundary:"}
            </strong>
            {" no information moves without the person's consent."}
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
