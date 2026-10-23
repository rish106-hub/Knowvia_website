// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";


export function ClauseBand() {
  return (
    <>
    <section aria-labelledby="terms-h" style={{background: "#DDF0DC", padding: "clamp(64px,7vw,96px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto"}}>
        <h2 id="terms-h" style={{margin: "0 0 14px", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(34px,3.6vw,52px)", color: "#0F4A3A"}}>
          {"Every clause that decides your bill."}
        </h2>
        <p style={{margin: "0 0 32px", fontSize: "19px", lineHeight: "1.5"}}>
          {"We explain each term in plain words, with the page it sits on."}
        </p>
        <div className="kv-term-grid" style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "18px"}}>
          <article style={{background: "#FFFFFF", borderRadius: "18px", padding: "24px"}}>
            <h3 style={{margin: "0 0 14px", color: "#163F42"}}>
              {"Costs"}
            </h3>
            <p style={{margin: "0", lineHeight: "1.9"}}>
              {"Room-rent limit"}
              <br />
              {"Co-pay"}
              <br />
              {"Deductible"}
              <br />
              {"Sub-limit"}
            </p>
          </article>
          <article style={{background: "#FFFFFF", borderRadius: "18px", padding: "24px"}}>
            <h3 style={{margin: "0 0 14px", color: "#163F42"}}>
              {"Eligibility"}
            </h3>
            <p style={{margin: "0", lineHeight: "1.9"}}>
              {"Waiting period"}
              <br />
              {"Pre-existing disease"}
              <br />
              {"Day-care procedure"}
            </p>
          </article>
          <article style={{background: "#FFFFFF", borderRadius: "18px", padding: "24px"}}>
            <h3 style={{margin: "0 0 14px", color: "#163F42"}}>
              {"Claims and continuity"}
            </h3>
            <p style={{margin: "0", lineHeight: "1.9"}}>
              {"Cashless claim"}
              <br />
              {"Network hospital"}
              <br />
              {"Portability"}
              <br />
              {"Restoration benefit"}
              <br />
              {"No-claim bonus"}
            </p>
          </article>
        </div>
      </div>
    </section>
    </>
  );
}
