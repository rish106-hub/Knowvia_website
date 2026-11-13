// Hand-written, not generated from the design artboard: edit this file directly.
"use client";

import { type ReactNode, useEffect, useState } from "react";

const TOOL_HASHES = ["#tools", "#try", "#room-test"];

/**
 * Collapsed "Try it on a real rule" band. It holds the room-rent test so the main page stays short;
 * the section stays in the DOM while closed, so the landing model can still find #try and #room-range.
 */
export function ToolsSegment({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openForHash = () => {
      const hash = window.location.hash;
      if (!TOOL_HASHES.includes(hash)) return;
      setOpen(true);
      requestAnimationFrame(() => document.getElementById(hash === "#tools" ? "tools" : "try")?.scrollIntoView());
    };
    openForHash();
    window.addEventListener("hashchange", openForHash);
    return () => window.removeEventListener("hashchange", openForHash);
  }, []);

  return (
    <>
      <section id="tools" className="sb-tools" aria-labelledby="tools-h">
        <div className="sb-wrap sb-tools-row">
          <div className="sb-tools-copy">
            <h2 id="tools-h" className="sb-h2 sb-mask">
              {"Try one rule on "}
              <span className="mk">{"your own numbers."}</span>
            </h2>
            <p className="sb-lede sb-rv" style={{ ["--d" as string]: "120ms" }}>
              {"Pick a hospital room and see how a room-rent limit changes the whole bill, not just the room."}
            </p>
          </div>
          <button className="sb-btn" type="button" aria-expanded={open} aria-controls="tools-body" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide the room test" : "Open the room test"}
          </button>
        </div>
      </section>
      <div id="tools-body" hidden={!open}>
        {children}
      </div>
    </>
  );
}
