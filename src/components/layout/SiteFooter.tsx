/* eslint-disable @next/next/no-img-element -- logos keep a fixed height with natural width */
import "../home/sb-close.css";
import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="sb-foot">
      <div className="sb-foot-in">
        <div className="sb-foot-top">
          <div className="sb-foot-brand">
            <div className="sb-foot-mark">
              <svg width="34" height="34" viewBox="0 0 800 800" aria-hidden="true">
                <rect width="800" height="800" rx="144" fill="#2a4e3d"></rect>
                <path d="M258 194v412M265 404l274 210" fill="none" stroke="#F3F7F6" strokeWidth="58" strokeLinecap="round"></path>
                <path d="M265 404l274-210" fill="none" stroke="#F4C542" strokeWidth="58" strokeLinecap="round"></path>
                <path d="M557 150l46 46-46 46-46-46z" fill="#F4C542"></path>
              </svg>
              <span>{"Knowvia"}</span>
            </div>
            <p className="sb-foot-line">{"Know your cover. Before you need it."}</p>
            <p className="sb-foot-sm">{"Health insurance only."}</p>
            <div className="sb-foot-backers">
              <span>{"Supported by"}</span>
              <img src="/logos/lightspeed.png" alt="Lightspeed India" style={{ height: 20 }} />
              <span aria-hidden="true" style={{ width: 1, height: 24, background: "rgba(255,255,255,0.25)" }}></span>
              <img src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" style={{ height: 26 }} />
            </div>
          </div>
          <nav className="sb-foot-col" aria-label="Knowvia">
            <h2>{"Knowvia"}</h2>
            <Link className="sb-fl" href="/#how">{"How it works"}</Link>
            <Link className="sb-fl" href="/#partners">{"For business"}</Link>
            <Link className="sb-fl" href="/#questions">{"Questions"}</Link>
          </nav>
          <div className="sb-foot-col">
            <h2>{"Contact"}</h2>
            <Link className="sb-fl" href="/contact">{"Contact us"}</Link>
            <a className="sb-fl" href={`mailto:${site.contactEmail}`}>{"Write to us"}</a>
          </div>
          <nav className="sb-foot-col" aria-label="Legal">
            <h2>{"Legal"}</h2>
            <Link className="sb-fl" id="privacy-notice" href="/privacy">{"Privacy notice"}</Link>
            <Link className="sb-fl" href="/terms">{"Terms"}</Link>
            <Link className="sb-fl" href="/cancellation-and-refund">{"Cancellation and refund"}</Link>
            <Link className="sb-fl" href="/shipping-and-exchange">{"Shipping and exchange"}</Link>
            <Link className="sb-fl" href="/#top" style={{ marginTop: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5"></path>
                <path d="M6 11l6-6 6 6"></path>
              </svg>
              {"Back to top"}
            </Link>
          </nav>
        </div>
        <div className="sb-foot-small">
          <p>{"Where our numbers come from: more than 50 recorded conversations with people in Delhi, Mumbai, Bengaluru, Chennai and many other Tier 1, 2 and 3 cities across India."}</p>
          <p>{"© 2026 Knowvia"}</p>
        </div>
      </div>
    </footer>
  );
}
