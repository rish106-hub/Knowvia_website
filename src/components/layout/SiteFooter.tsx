// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.

import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <>
    <footer style={{background: "#0B383B", color: "#C9DDD9", padding: "clamp(52px,6vw,80px) clamp(20px,5vw,80px)"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "40px"}}>
        <div style={{display: "flex", flexWrap: "wrap", gap: "36px 72px"}}>
          <div style={{flex: "2 1 300px"}}>
            <div style={{display: "flex", alignItems: "center", gap: "10px", color: "#FFFFFF"}}>
              <svg width="34" height="34" viewBox="0 0 800 800" aria-hidden="true">
                <rect width="800" height="800" rx="144" fill="#163F42"></rect>
                <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58"></path>
                <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58"></path>
              </svg>
              <span style={{fontSize: "22px", fontWeight: "600"}}>
                {"Knowvia"}
              </span>
            </div>
            <p>
              {"Health insurance only. Supported by Lightspeed India and Insurance Samadhan."}
            </p>
          </div>
          <nav aria-label="Knowvia" style={{flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "12px"}}>
            <strong style={{color: "#FFFFFF"}}>
              {"Knowvia"}
            </strong>
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
          <div style={{flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "12px"}}>
            <strong style={{color: "#FFFFFF"}}>
              {"Contact"}
            </strong>
            <a className="kv-foot-link" href={`mailto:${site.contactEmail}`}>
              {"Write to us"}
            </a>
          </div>
          <nav aria-label="Legal" style={{flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "12px"}}>
            <strong style={{color: "#FFFFFF"}}>
              {"Legal"}
            </strong>
            <Link className="kv-foot-link" id="privacy-notice" href="/privacy">
              {"Privacy notice"}
            </Link>
            <Link className="kv-foot-link" href="/terms">
              {"Terms"}
            </Link>
            <Link className="kv-foot-link" href="/#top">
              {"Back to top"}
            </Link>
          </nav>
        </div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.16)", paddingTop: "22px", fontSize: "15px", lineHeight: "1.5"}}>
          <p>
            {"Knowvia is not an insurer, broker or TPA, and does not decide claims."}
          </p>
          <p>
            {"Research examples come from more than 50 recorded conversations across India. Names are withheld. Figures are examples, not averages."}
          </p>
          <p>
            {"© 2026 Knowvia"}
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
