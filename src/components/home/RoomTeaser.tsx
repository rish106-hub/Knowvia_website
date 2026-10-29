// Hand-written, not generated from the design artboard: edit this file directly.
"use client";

import { useEffect, useRef, useState } from "react";
import type { Any } from "@/lib/dc";
import { RoomTestSection } from "./RoomTestSection";
import "./room-teaser.css";

/** Same illustration as the room test in landing-model.js: ₹5,00,000 cover, ₹5,000 a day limit, 4 nights, ₹1,60,000 of room-linked charges. */
const LIMIT = 5000;
const NIGHTS = 4;
const LINKED = 160000;

const ROOMS = [
  { name: "Twin", rate: 5000 },
  { name: "Single AC", rate: 8000 },
  { name: "Deluxe", rate: 12000 },
];

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const outOfPocket = (rate: number) => (rate > LIMIT ? (rate - LIMIT) * NIGHTS + LINKED * (1 - LIMIT / rate) : 0);

/**
 * The room test as a teaser: a live "what you would pay" demo that cycles through three rooms,
 * and a button that opens the full interactive test in a pop-up.
 */
export function RoomTeaser({ v }: { v: Any }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Cycle the demo rooms. Skipped when the visitor prefers reduced motion, or while the pop-up is open.
  useEffect(() => {
    if (open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ROOMS.length), 2400);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const root = document.documentElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // kv-lock stops the page's smooth scroll and locks body scroll while the pop-up is open.
    root.classList.toggle("kv-lock", open);
    return () => root.classList.remove("kv-lock");
  }, [open]);

  const room = ROOMS[idx];
  const oop = outOfPocket(room.rate);
  const upgrade = outOfPocket(8000);

  return (
    <>
      <section id="try" className="kv-rt" aria-labelledby="room-h">
        <div className="kv-wrap kv-rt-grid">
          <div style={{display: "flex", flexDirection: "column", gap: "22px"}}>
            <p className="kv-eyebrow kv-reveal" style={{color: "#7A5207"}}>
              {"Try it · the room test"}
            </p>
            <h2 id="room-h" className="kv-h2 kv-reveal" style={{color: "#7A5207", maxWidth: "16ch"}}>
              {"One room choice can cut your whole claim."}
            </h2>
            <p className="kv-lede kv-reveal kv-d120" style={{color: "#1A3034", maxWidth: "40ch"}}>
              {`Pay ₹3,000 a day more for a room and you could pay ${inr(upgrade)} yourself. Find out what your room would cost you.`}
            </p>
            <button className="kv-rt-cta" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
              {"Try the room test"}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"></path>
              </svg>
            </button>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#7A5207"}}>
              {"Illustration: ₹5,00,000 cover, room limit 1% a day, 4 nights. Rules differ by policy."}
            </p>
          </div>
          <button className="kv-rt-card" type="button" onClick={() => setOpen(true)} aria-label="Open the room test">
            <p style={{margin: "0", fontSize: "14px", fontWeight: "700", letterSpacing: "0.06em", color: "#F6D38A"}}>
              {"YOU WOULD PAY OUT OF POCKET"}
            </p>
            <div className="kv-rt-chips" aria-hidden="true">
              {ROOMS.map((r, i) => (
                <span key={r.name} className="kv-rt-chip" data-on={i === idx}>
                  <b>{r.name}</b>
                  <span>{`${inr(r.rate)}/day`}</span>
                </span>
              ))}
            </div>
            <p className="kv-rt-num" aria-live="off" style={{margin: "0", color: oop ? "#F6D38A" : "#C8E6A0"}}>
              {inr(oop)}
            </p>
            <p className="kv-rt-hint">
              {oop ? `Over the ₹5,000 limit, so room-linked charges are cut too.` : "Within the limit. Everything is paid."}
            </p>
            <p className="kv-rt-hint" style={{color: "#F6D38A", fontWeight: "600"}}>
              {"Tap to try your own room →"}
            </p>
          </button>
        </div>
      </section>
      <dialog
        ref={dialogRef}
        className="kv-rt-dialog"
        aria-label="The room test"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {open && (
          <>
            <div className="kv-rt-close">
              <button type="button" onClick={() => setOpen(false)}>
                {"Close"}
              </button>
            </div>
            <RoomTestSection v={v} />
          </>
        )}
      </dialog>
    </>
  );
}
