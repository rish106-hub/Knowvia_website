"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function RoomTestSection({ v }: { v: Any }) {
  const rate = Number(String(v.room.rateShown).replace(/[^\d]/g, "")) || 8000;
  const pct = Math.min(100, Math.max(0, ((rate - 2000) / 13000) * 100));
  const zero = v.room.oop === "₹0";
  return (
    <section id="room-test" className="sb-room on-dark" aria-labelledby="room-h">
      <div className="sb-room-l">
        <p className="sb-eyebrow">{"Try it · the room test"}</p>
        <h2 id="room-h" className="sb-h2 sb-room-h">
          {"One room choice can "}
          <span className="mk dk">{"cut your whole claim."}</span>
        </h2>
        <p className="sb-lede">
          {"Pick a room above your policy's limit and insurers can cut every room-linked charge. Not just the room."}
        </p>
        <div className="sb-rooms" role="group" aria-label="Room type">
          {(v.room.types ?? []).map((rt: Any, i1: number) => (
            <Fragment key={i1}>
              <button type="button" aria-pressed={rt.pressed} onClick={rt.pick}>
                <b>{rt.name}</b>
                <small>{rt.rate}</small>
              </button>
            </Fragment>
          ))}
        </div>
        <div>
          <label htmlFor="room-range" className="sb-slider-meta">
            <span>{"Room rent per day"}</span>
            <span className="sb-slider-val">{v.room.rateShown}</span>
          </label>
          <input id="room-range" className="sb-range" type="range" min="2000" max="15000" step="500" defaultValue="8000" onChange={v.room.setRate} style={{ ["--p" as string]: `${pct}%` }} />
          <p className="sb-slider-note">{"Your policy's limit: ₹5,000 a day"}</p>
        </div>
        <p className="sb-room-fine">
          {"₹5,00,000 cover, room limit 1% a day, 4 nights, ₹1,60,000 of room-linked charges. Rules differ by policy."}
        </p>
      </div>
      <div className="sb-result" aria-live="polite">
        <small>{"YOU PAY OUT OF POCKET"}</small>
        <p className={`sb-oop${zero ? "" : " hit"}`}>{v.room.oop}</p>
        <div className="sb-split" aria-hidden="true">
          <span className="paid" style={{ width: css(v.room.paidBar).width }}></span>
          <span className="you" style={{ width: css(v.room.oopBar).width }}></span>
        </div>
        <div className="sb-bill">
          <div className="sb-billrow"><span>{"Room, 4 nights"}</span><span>{v.room.roomCost}</span></div>
          <div className="sb-billrow"><span>{"Room-linked charges"}</span><span>{"₹1,60,000"}</span></div>
          <div className="sb-billrow"><span>{"Medicines"}</span><span>{"₹40,000"}</span></div>
          <div className="sb-billrow"><span>{"Cut by insurer"}</span><span className="sb-cut">{v.room.cut}</span></div>
          <div className="sb-billrow"><span><b>{"Insurer pays"}</b></span><span>{v.room.paid}</span></div>
        </div>
        <p className="sb-verdict">{v.room.verdict}</p>
      </div>
    </section>
  );
}
