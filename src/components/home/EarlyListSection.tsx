// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { type Any, css, truthy } from "@/lib/dc";

export function EarlyListSection({ v }: { v: Any }) {
  return (
    <>
    <section id="early-list" aria-labelledby="close-h" style={{background: "#163F42", color: "#FFFFFF", padding: "clamp(72px,8vw,104px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "980px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "36px 64px", alignItems: "center"}}>
        <div style={{flex: "1 1 360px"}}>
          <p style={{margin: "0 0 14px", fontWeight: "700", color: "#C8E6A0"}}>
            {"The early list"}
          </p>
          <h2 id="close-h" style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontWeight: "400", fontSize: "clamp(36px,4vw,54px)", lineHeight: "1.05"}}>
            {"Know your cover before you need it."}
          </h2>
          <p style={{fontSize: "18px", lineHeight: "1.55", color: "#C9DDD9"}}>
            {"Leave your email. We will write once when Knowvia opens."}
          </p>
        </div>
        <div style={{flex: "1 1 400px", background: "#FFFFFF", color: "#1A3034", borderRadius: "22px", padding: "clamp(24px,3vw,34px)"}}>
          {truthy(v.close.showForm) && (
            <>
            <form onSubmit={v.close.submit} noValidate style={{display: "flex", flexDirection: "column", gap: "10px"}}>
              <label htmlFor="close-email" style={{fontSize: "15px", fontWeight: "600"}}>
                {"Email (required)"}
              </label>
              <input id="close-email" name="email" type="email" required autoComplete="email" onChange={v.close.setEmail} aria-invalid={v.close.invalid} aria-describedby="close-error close-consent" style={css(v.close.inputStyle)} />
              <p id="close-error" role="alert" style={{margin: "0", color: "#A74335", fontSize: "16px", fontWeight: "600"}}>
                {v.close.error}
              </p>
              <button className="kv-btn" type="submit" aria-disabled={v.close.busyStr} style={{marginTop: "4px", width: "100%", height: "56px", border: "0", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", font: "inherit", fontSize: "17px", fontWeight: "600", cursor: "pointer"}}>
                {v.close.buttonLabel}
              </button>
              <p id="close-consent" style={{margin: "4px 0 0", fontSize: "14px", lineHeight: "1.5", color: "#55696D"}}>
                {"We use your email only to tell you when Knowvia opens. Read the "}
                <Link href="/privacy">
                  {"privacy notice"}
                </Link>
                {"."}
              </p>
            </form>
            </>
          )}
          {" "}
          {truthy(v.close.showSuccess) && (
            <>
            <div role="status">
              <p style={{margin: "0", fontSize: "22px", fontWeight: "600"}}>
                {"You are on the list."}
              </p>
              <p style={{margin: "8px 0 0"}}>
                {"We will email "}{v.close.emailShown}{" when Knowvia opens."}
              </p>
            </div>
            </>
          )}
        </div>
      </div>
    </section>
    </>
  );
}
