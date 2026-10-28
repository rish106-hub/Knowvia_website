// Generated from the approved Claude Design artboard Main.dc.html. Edit the design, then regenerate with scripts/design-port.
"use client";

import { Fragment } from "react";
import { type Any, css } from "@/lib/dc";

export function RoomTestSection({ v }: { v: Any }) {
  return (
    <>
    <section id="try" className="kv-bleed kv-room" aria-labelledby="room-h">
      <div className="kv-L">
        <p className="kv-eyebrow kv-reveal" style={{color: "#7A5207"}}>
          {"Try it · the room test"}
        </p>
        {" "}
        <h2 id="room-h" className="kv-h2 kv-reveal" style={{color: "#7A5207", maxWidth: "16ch"}}>
          {"One room choice can cut your whole claim."}
        </h2>
        {" "}
        <p className="kv-lede kv-reveal kv-d120" style={{color: "#1A3034", maxWidth: "40ch"}}>
          {"Pick a room above your policy's limit and insurers can cut every room-linked charge. Not just the room."}
        </p>
        {" "}
        <div className="kv-segctl" role="group" aria-label="Room type">
          {(v.room.types ?? []).map((rt: Any, i1: number) => (
            <Fragment key={i1}>
              <button type="button" aria-pressed={rt.pressed} onClick={rt.pick}>
                <b style={{fontSize: "15px"}}>
                  {rt.name}
                </b>
                <span style={{fontSize: "14px", opacity: "0.85"}}>
                  {rt.rate}
                </span>
              </button>
            </Fragment>
          ))}
        </div>
        {" "}
        <div>
          <label htmlFor="room-range" style={{display: "flex", justifyContent: "space-between", fontWeight: "600"}}>
            <span>
              {"Room rent per day"}
            </span>
            <span>
              {v.room.rateShown}
            </span>
          </label>
          {" "}
          <input id="room-range" className="kv-range" type="range" min="2000" max="15000" step="500" defaultValue="8000" onChange={v.room.setRate} />
          {" "}
          <p style={{margin: "0", fontSize: "15px", color: "#55696D"}}>
            {"Your policy's limit: ₹5,000 a day"}
          </p>
        </div>
        {" "}
        <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#7A5207"}}>
          {"Illustration: ₹5,00,000 cover, room limit 1% a day, 4 nights, ₹1,60,000 of room-linked charges. Rules differ by policy."}
        </p>
      </div>
      {" "}
      <div className="kv-R" aria-live="polite">
        <svg className="kv-rings" aria-hidden="true" viewBox="0 0 800 800" style={{right: "-260px", top: "-260px", width: "720px", height: "720px", opacity: "0.1"}}>
          <circle cx="400" cy="400" r="290" fill="none" stroke="#F6D38A" strokeWidth="3"></circle>
          <circle cx="400" cy="400" r="240" fill="none" stroke="#F6D38A" strokeWidth="3"></circle>
          <circle cx="400" cy="400" r="190" fill="none" stroke="#F6D38A" strokeWidth="3"></circle>
        </svg>
        {" "}
        <p style={{position: "relative", margin: "0", fontSize: "14px", fontWeight: "700", letterSpacing: "0.06em", color: "#F6D38A"}}>
          {"YOU PAY OUT OF POCKET"}
        </p>
        {" "}
        <p className="kv-oop" style={css(v.room.oopStyle)}>
          {v.room.oop}
        </p>
        {" "}
        <div className="kv-split" aria-hidden="true" style={{position: "relative"}}>
          <span style={css(v.room.paidBar)}></span>
          <span className="kv-hatch" style={css(v.room.oopBar)}></span>
        </div>
        {" "}
        <div style={{position: "relative", maxWidth: "520px", borderTop: "1px solid rgba(255,255,255,0.18)"}}>
          <div className="kv-billrow">
            <span>
              {"Room, 4 nights"}
            </span>
            <span>
              {v.room.roomCost}
            </span>
          </div>
          {" "}
          <div className="kv-billrow">
            <span>
              {"Room-linked charges"}
            </span>
            <span>
              {"₹1,60,000"}
            </span>
          </div>
          {" "}
          <div className="kv-billrow">
            <span>
              {"Medicines"}
            </span>
            <span>
              {"₹40,000"}
            </span>
          </div>
          {" "}
          <div className="kv-billrow">
            <span>
              {"Cut by insurer"}
            </span>
            <span style={{color: "#F6D38A"}}>
              {v.room.cut}
            </span>
          </div>
          {" "}
          <div className="kv-billrow">
            <span style={{fontWeight: "700"}}>
              {"Insurer pays"}
            </span>
            <span>
              {v.room.paid}
            </span>
          </div>
        </div>
        {" "}
        <p style={{position: "relative", margin: "0", fontSize: "17px", lineHeight: "1.5", maxWidth: "44ch"}}>
          {v.room.verdict}
        </p>
      </div>
    </section>
    </>
  );
}
