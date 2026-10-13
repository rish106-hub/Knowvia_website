"use client";

import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";

const links = [
  ["How it works", "/#how"],
  ["Privacy", "/#privacy"],
  ["For partners", "/#partners"],
  ["Questions", "/#questions"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <BrandMark />
        <div className={`nav-links ${open ? "is-open" : ""}`}>
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="button button-small mobile-join" href="/#early-list" onClick={() => setOpen(false)}>Join the early list</Link>
        </div>
        <Link className="button button-small desktop-join" href="/#early-list">Join the early list</Link>
        <button className="menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={25} /> : <List size={25} />}
        </button>
      </nav>
    </header>
  );
}
