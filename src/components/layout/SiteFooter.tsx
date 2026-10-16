// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.

import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <>
    <footer style={{position: "relative", background: "#0B383B", color: "#C9DDD9", padding: "clamp(56px,6vw,88px) clamp(20px,5vw,80px) clamp(36px,4vw,48px)"}}>
      <div style={{position: "relative", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "48px"}}>
        <div style={{display: "flex", flexWrap: "wrap", gap: "40px 72px"}}>
          <div style={{flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "14px"}}>
            <div style={{display: "flex", alignItems: "center", gap: "10px", color: "#FFFFFF"}}>
              <svg width="34" height="34" viewBox="0 0 800 800" aria-hidden="true">
                <rect width="800" height="800" rx="144" fill="#163F42"></rect>
                <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
                <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
                <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
              </svg>
              <span style={{fontSize: "22px", fontWeight: "600"}}>
                {"Knowvia"}
              </span>
            </div>
            <p style={{margin: "0", fontFamily: "var(--font-display), 'Iowan Old Style', Georgia, serif", fontSize: "26px", lineHeight: "1.25", color: "#FFFFFF", maxWidth: "16ch"}}>
              {"Know your cover. Before you need it."}
            </p>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5"}}>
              {"Health insurance only. Supported by Lightspeed India and Insurance Samadhan."}
            </p>
          </div>
          <nav aria-label="Knowvia" style={{flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px"}}>
            <p style={{margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "#FFFFFF"}}>
              {"Knowvia"}
            </p>
            <Link className="kv-foot-link" href="/#how">
              {"How it works"}
            </Link>
            <Link className="kv-foot-link" href="/#privacy">
              {"Privacy"}
            </Link>
            <Link className="kv-foot-link" href="/#partners">
              {"For business"}
            </Link>
            <Link className="kv-foot-link" href="/#questions">
              {"Questions"}
            </Link>
          </nav>
          <div style={{flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px"}}>
            <p style={{margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "#FFFFFF"}}>
              {"Contact"}
            </p>
            <a className="kv-foot-link" href={`mailto:${site.contactEmail}`}>
              {"Write to us"}
            </a>
          </div>
          <nav aria-label="Legal" style={{flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px"}}>
            <p style={{margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "#FFFFFF"}}>
              {"Legal"}
            </p>
            <Link className="kv-foot-link" id="privacy-notice" href="/privacy">
              {"Privacy notice"}
            </Link>
            <Link className="kv-foot-link" href="/terms">
              {"Terms"}
            </Link>
            <Link className="kv-foot-link" href="/#top" style={{marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "8px"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5"></path>
                <path d="M6 11l6-6 6 6"></path>
              </svg>
              {"Back to top"}
            </Link>
          </nav>
        </div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.16)", paddingTop: "24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px 48px", fontSize: "15px", lineHeight: "1.5"}}>
          <div style={{flex: "1 1 520px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "880px"}}>
            <p style={{margin: "0"}}>
              {"Knowvia is not an insurer, broker or TPA, and does not decide claims."}
            </p>
            <p style={{margin: "0"}}>
              {"Where our numbers come from: more than 50 recorded conversations with people in Delhi, Mumbai, Bengaluru, Chennai and many other Tier 1, 2 and 3 cities across India. Names are withheld. Figures are what people told us and what their documents showed. They are examples, not averages."}
            </p>
          </div>
          <p style={{margin: "0", alignSelf: "flex-end"}}>
            {"© 2026 Knowvia"}
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
