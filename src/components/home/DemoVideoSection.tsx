// Hand-written, not generated from the design artboard: edit this file directly.

/** Silent walkthrough of the app flow on a synthetic family and policy. Nothing here is a real person, insurer or document. */
export function DemoVideoSection() {
  return (
    <section id="demo" aria-labelledby="demo-h" style={{background: "#F3F7F6", padding: "clamp(72px,9vw,128px) 0"}}>
      <div className="kv-wrap" style={{display: "flex", flexDirection: "column", gap: "clamp(32px,4vw,48px)"}}>
        <div style={{display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px"}}>
          <p className="kv-eyebrow kv-reveal" style={{color: "#176F69"}}>
            {"See it work"}
          </p>
          <h2 id="demo-h" className="kv-h2 kv-reveal" style={{color: "#163F42", maxWidth: "16ch"}}>
            {"From policy PDF to a page-cited answer."}
          </h2>
          <p className="kv-lede kv-reveal kv-d120" style={{color: "#1A3034", maxWidth: "44ch"}}>
            {"A short walkthrough. Add a policy, give consent, and see what the document says, with the exact page."}
          </p>
        </div>
        <figure className="kv-reveal" style={{margin: "0", display: "flex", flexDirection: "column", gap: "12px"}}>
          <video
            controls
            muted
            playsInline
            preload="metadata"
            poster="/demo/knowvia-demo-poster.png"
            aria-label="Walkthrough of the Knowvia app on a synthetic family policy"
            style={{display: "block", width: "100%", height: "auto", aspectRatio: "16 / 10", background: "#163F42", borderRadius: "24px", boxShadow: "0 0 0 1px #CFDCDA, 0 24px 60px rgba(22,63,66,0.14)"}}
          >
            <source src="/demo/knowvia-demo.webm" type="video/webm" />
            {"Your browser cannot play this video."}
          </video>
          <figcaption style={{fontSize: "15px", lineHeight: "1.5", color: "#55696D"}}>
            {"Synthetic demo. The family, insurer and policy are made up. Nothing here is advice on what your insurer will pay."}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
