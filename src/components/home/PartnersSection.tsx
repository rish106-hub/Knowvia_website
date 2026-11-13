"use client";

import "./sb-close.css";
import { type Any } from "@/lib/dc";

const STEPS: [string, string][] = [
  ["Your platform", "At joining or a benefits change on HR platforms. After a purchase or renewal on insurance platforms."],
  ["The person says yes", "No data moves without their consent, field by field."],
  ["Knowvia reads it", "Every policy in the household, person by person, linked to the issued policy."],
  ["You keep the relationship", "Your team stays the support contact. Knowvia does the reading."],
];

export function PartnersSection({ v }: { v: Any }) {
  const flowOn = String(v.flowCls ?? "").includes("kv-on");
  return (
    <section id="partners" className="sb-biz on-dark" aria-labelledby="partners-h">
      <div className="sb-wrap sb-biz-grid">
        <div className="sb-biz-copy">
          <p className="sb-biz-brand">
            <svg width="30" height="30" viewBox="0 0 800 800" aria-hidden="true">
              <rect width="800" height="800" rx="144" fill="#13281f"></rect>
              <path d="M258 194v412M265 404l274 210" fill="none" stroke="#E8EEE6" strokeWidth="58" strokeLinecap="round"></path>
              <path d="M265 404l274-210" fill="none" stroke="#F4C542" strokeWidth="58" strokeLinecap="round"></path>
              <path d="M557 150l46 46-46 46-46-46z" fill="#F4C542"></path>
            </svg>
            <span className="sb-biz-name">{"Knowvia"}</span>
            <span className="sb-biz-tag">{"for Business"}</span>
          </p>
          <h2 id="partners-h" className="sb-mask">
            {"Fewer “what does my policy cover?” "}
            <span className="mk">{"calls."}</span>
          </h2>
          <p className="sb-lede sb-rv" style={{ ["--d" as string]: "120ms" }}>
            {"For HR platforms, insurance platforms and advisers. Your employees and customers get a clear view of every policy in their household. You keep your own support relationship."}
          </p>
          <a className="sb-btn sb-rv" style={{ ["--d" as string]: "200ms" }} href="#ask">
            {"Talk to us about a pilot"}
          </a>
        </div>
        <ol className={"sb-flow" + (flowOn ? " in" : "")} aria-label="How a pilot works">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <i aria-hidden="true">
                {i === STEPS.length - 1 ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="5 12.5 10 17 19 7"></polyline>
                  </svg>
                ) : (
                  i + 1
                )}
              </i>
              <b>{t}</b>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
