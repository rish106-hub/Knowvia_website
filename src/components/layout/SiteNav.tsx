// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import Link from "next/link";
import { type Any, truthy } from "@/lib/dc";
import { useState } from "react";

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const v: Any = { menuOpen, menuOpenStr: menuOpen ? "true" : "false", toggleMenu: () => setMenuOpen((open) => !open) };
  return (
    <>
    <header className="kv-nav" style={{borderBottom: "1px solid rgba(207,220,218,0.7)", padding: "0 clamp(20px,5vw,80px)"}}>
      <nav aria-label="Main" style={{maxWidth: "1200px", margin: "0 auto", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px"}}>
        <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
          <Link href="/#top" aria-label="Knowvia home" style={{display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "#163F42"}}>
            <svg width="34" height="34" viewBox="0 0 800 800" aria-hidden="true">
              <rect width="800" height="800" rx="144" fill="#163F42"></rect>
              <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
              <path d="M265 404l274-210" fill="none" stroke="#E0A02B" strokeWidth="58" strokeLinecap="round"></path>
              <path d="M557 150l46 46-46 46-46-46z" fill="#E0A02B"></path>
            </svg>
            <span style={{fontSize: "22px", fontWeight: "600", letterSpacing: "-0.01em"}}>
              {"Knowvia"}
            </span>
          </Link>
        </div>
        <div className="kv-desktop" style={{display: "flex", alignItems: "center", gap: "32px", fontSize: "16px", fontWeight: "600"}}>
          <Link className="kv-nav-link" href="/#how">
            {"How it works"}
          </Link>
          <Link className="kv-nav-link" href="/#privacy">
            {"Privacy"}
          </Link>
          <Link className="kv-nav-link" href="/#partners">
            {"For business"}
          </Link>
          <Link className="kv-nav-link" href="/#questions">
            {"Questions"}
          </Link>
        </div>
        <Link className="kv-btn kv-desktop" href="/#early-list" style={{display: "inline-flex", alignItems: "center", height: "44px", padding: "0 22px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "16px", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap"}}>
          {"Join the early list"}
        </Link>
        <div className="kv-mobile">
          <button type="button" onClick={v.toggleMenu} aria-expanded={v.menuOpenStr} aria-controls="mobile-menu" style={{display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 14px", border: "1px solid #7B918E", borderRadius: "10px", background: "#FFFFFF", color: "#163F42", font: "inherit", fontSize: "16px", fontWeight: "600", cursor: "pointer"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16"></path>
            </svg>
            {"Menu"}
          </button>
        </div>
      </nav>
      {" "}
      {truthy(v.menuOpen) && (
        <>
        <div id="mobile-menu" className="kv-mobile" style={{padding: "8px 0 24px"}}>
          <div style={{display: "flex", flexDirection: "column", fontSize: "19px", fontWeight: "600"}}>
            <Link href="/#how" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"How it works"}
            </Link>
            <Link href="/#privacy" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"Privacy"}
            </Link>
            <Link href="/#partners" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"For business"}
            </Link>
            <Link href="/#questions" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"Questions"}
            </Link>
            <Link className="kv-btn" href="/#early-list" style={{marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", textDecoration: "none"}}>
              {"Join the early list"}
            </Link>
          </div>
        </div>
        </>
      )}
    </header>
    </>
  );
}
