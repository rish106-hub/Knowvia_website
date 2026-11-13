"use client";

import Link from "next/link";
import { useState } from "react";
import { betaDemoUrl } from "@/lib/beta-url";

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sb sb-nav kv-nav">
      <nav className="sb-nav-in" aria-label="Main">
        <Link className="sb-brand" href="/#top" aria-label="Knowvia home">
          <svg width="34" height="34" viewBox="0 0 800 800" aria-hidden="true">
            <rect width="800" height="800" rx="144" fill="#1F3B2E"></rect>
            <path d="M258 194v412M265 404l274 210" fill="none" stroke="#E8EEE6" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M265 404l274-210" fill="none" stroke="#F4C542" strokeWidth="58" strokeLinecap="round"></path>
            <path d="M557 150l46 46-46 46-46-46z" fill="#F4C542"></path>
          </svg>
          {"Knowvia"}
        </Link>
        <div className="sb-nav-links">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
        <div className="kv-desktop" style={{display: "flex", alignItems: "center", gap: "12px"}}>
          <a className="kv-btn-ghost" href={betaDemoUrl()} style={{display: "inline-flex", alignItems: "center", height: "44px", padding: "0 22px", borderRadius: "999px", border: "1px solid #176F69", background: "transparent", color: "#176F69", fontSize: "16px", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap"}}>
            {"View demo"}
          </a>
          <Link className="kv-btn" href="/#early-list" style={{display: "inline-flex", alignItems: "center", height: "44px", padding: "0 22px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "16px", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap"}}>
            {"Join the early list"}
          </Link>
        </div>
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
            <Link href="/#research" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"Our research"}
            </Link>
            <Link href="/#how" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"How it works"}
            </Link>
            <Link href="/#try" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"Room test"}
            </Link>
            <Link href="/#privacy" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"Privacy"}
            </Link>
            <Link href="/#questions" style={{minHeight: "52px", display: "flex", alignItems: "center", borderBottom: "1px solid #CFDCDA", color: "#1A3034", textDecoration: "none"}}>
              {"Questions"}
            </Link>
            <a className="kv-btn-ghost" href={betaDemoUrl()} style={{marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", border: "1px solid #176F69", background: "transparent", color: "#176F69", fontSize: "17px", textDecoration: "none"}}>
              {"View demo"}
            </a>
            <Link className="kv-btn" href="/#early-list" style={{marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", height: "56px", borderRadius: "999px", background: "#176F69", color: "#FFFFFF", fontSize: "17px", textDecoration: "none"}}>
              {"Join the early list"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
