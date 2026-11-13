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
      <section id="try" className="sb-try on-dark" aria-labelledby="room-h">
        <div className="sb-wrap sb-try-grid">
          <div className="sb-try-copy">
            <p className="sb-eyebrow sb-rv">{"Try it · the room test"}</p>
            <h2 id="room-h" className="sb-h2 sb-mask">
              {"One room choice can "}
              <span className="mk">{"cut your whole claim."}</span>
            </h2>
            <p className="sb-lede sb-rv">
              {`Pay ₹3,000 a day more for a room and you could pay ${inr(upgrade)} yourself. Find out what your room would cost you.`}
            </p>
            <button className="sb-btn" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
              {"Try the room test"}
            </button>
            <p className="sb-try-fine">
              {"₹5,00,000 cover, room limit 1% a day, 4 nights. Rules differ by policy."}
            </p>
          </div>
          <button className="sb-result sb-try-card" type="button" onClick={() => setOpen(true)} aria-label="Open the room test">
            <small>{"YOU WOULD PAY OUT OF POCKET"}</small>
            <div className="sb-rooms" aria-hidden="true">
              {ROOMS.map((r, i) => (
                <span key={r.name} className="sb-rchip" data-on={i === idx}>
                  <b>{r.name}</b>
                  <small>{`${inr(r.rate)}/day`}</small>
                </span>
              ))}
            </div>
            <p className={`sb-oop${oop ? " hit" : ""}`} aria-live="off">
              {inr(oop)}
            </p>
            <div className="sb-split" aria-hidden="true">
              <span className="paid" style={{ width: `${((1 - oop / (room.rate * NIGHTS + LINKED + 40000)) * 100).toFixed(2)}%` }}></span>
              <span className="you" style={{ width: `${((oop / (room.rate * NIGHTS + LINKED + 40000)) * 100).toFixed(2)}%` }}></span>
            </div>
            <p className="sb-verdict">
              {oop ? `Over the ₹5,000 limit, so room-linked charges are cut too.` : "Within the limit. Everything is paid."}
            </p>
            <span className="sb-try-tap">{"Tap to try your own room →"}</span>
          </button>
        </div>
      </section>
      <dialog
        ref={dialogRef}
        className="sb-room-dialog"
        aria-label="The room test"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {open && (
          <>
            <div className="sb-room-close">
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
