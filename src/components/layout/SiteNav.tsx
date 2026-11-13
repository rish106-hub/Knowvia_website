"use client";

import Link from "next/link";
import { useState } from "react";
import "../home/sunbeam.css";
import "../home/sb-hero.css";

const LINKS: [string, string][] = [
  ["/#research", "Our research"],
  ["/#how", "How it works"],
  ["/#try", "Room test"],
  ["/#questions", "Questions"],
];

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
        <Link className="sb-btn sb-nav-cta" href="/#early-list">
          {"Join the early list"}
        </Link>
        <button className="sb-nav-menu" type="button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen ? "true" : "false"} aria-controls="mobile-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16"></path>
          </svg>
          {"Menu"}
        </button>
      </nav>
      {menuOpen && (
        <div id="mobile-menu" className="sb-nav-sheet">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <Link className="sb-btn" href="/#early-list" onClick={() => setMenuOpen(false)}>
            {"Join the early list"}
          </Link>
        </div>
      )}
    </header>
  );
}
